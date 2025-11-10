import { Mutex } from 'async-mutex';
import { Inject, Injectable } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@/common/exceptions';
import { Coupon } from '@/domain/coupon/coupon.entity';
import { COUPON_REPOSITORY, type CouponRepository } from '@/domain/coupon/coupon.repository';
import { UserCouponStatistics } from '@/domain/coupon/user-coupon-statistics.vo';
import { UserCoupon } from '@/domain/coupon/user-coupon.entity';
import { ValidityPeriod } from '@/domain/coupon/validity-period.vo';

@Injectable()
export class CouponService {
  private readonly couponMutexes = new Map<string, Mutex>();

  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: CouponRepository,
  ) {}

  async issueCoupon(couponId: string, userId: string, issuedAt: Date = new Date()): Promise<UserCoupon> {
    const mutex = this.getCouponMutex(couponId);
    const release = await mutex.acquire();

    try {
      const exists = await this.couponRepository.existsUserCouponByCouponIdAndUserId(couponId, userId);
      if (exists) {
        throw new BadRequestException('이미 발급받은 쿠폰입니다.');
      }

      const coupon = await this.couponRepository.findCouponByIdWithLock(couponId);
      if (!coupon) {
        throw new NotFoundException('쿠폰을 찾을 수 없습니다.');
      }

      if (!coupon.canIssue(issuedAt)) {
        throw new BadRequestException('쿠폰을 발급할 수 없습니다.');
      }

      coupon.issue();
      await this.couponRepository.saveCoupon(coupon);

      const userCoupon = new UserCoupon(
        '', // TODO: Prisma에서 생성된 ID 사용
        userId,
        couponId,
        issuedAt,
        new ValidityPeriod(coupon.getValidityPeriod().getFrom(), coupon.getValidityPeriod().getUntil()),
      );

      await this.couponRepository.saveUserCoupon(userCoupon);

      return userCoupon;
    } finally {
      release();
    }
  }

  private getCouponMutex(couponId: string): Mutex {
    if (!this.couponMutexes.has(couponId)) {
      this.couponMutexes.set(couponId, new Mutex());
    }
    return this.couponMutexes.get(couponId)!;
  }

  async getMyCoupons(userId: string): Promise<UserCoupon[]> {
    return await this.couponRepository.findUserCouponsByUserId(userId);
  }

  async getMyCouponsWithStatistics(userId: string, at: Date = new Date()): Promise<UserCouponStatistics> {
    const userCoupons = await this.couponRepository.findUserCouponsByUserId(userId);
    return UserCouponStatistics.fromUserCoupons(userCoupons, at);
  }

  async getMyAvailableCoupons(userId: string, at: Date = new Date()): Promise<UserCoupon[]> {
    return await this.couponRepository.findAvailableUserCouponsByUserId(userId, at);
  }

  async getCouponById(couponId: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findCouponById(couponId);
    if (!coupon) {
      throw new NotFoundException('쿠폰을 찾을 수 없습니다.');
    }
    return coupon;
  }

  async getCouponInfoByUserCouponId(
    userCouponId: string,
  ): Promise<{ id: string; name: string; discountType: string; discountValue: number } | null> {
    const userCoupon = await this.couponRepository.findUserCouponById(userCouponId);
    if (!userCoupon) {
      return null;
    }

    const coupon = await this.couponRepository.findCouponById(userCoupon.getCouponId());
    if (!coupon) {
      return null;
    }

    return {
      id: coupon.getId(),
      name: coupon.getName(),
      discountType: coupon.getDiscountValue().getType(),
      discountValue: coupon.getDiscountValue().getValue(),
    };
  }
}
