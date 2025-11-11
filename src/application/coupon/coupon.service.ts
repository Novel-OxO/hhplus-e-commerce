import { Inject, Injectable } from '@nestjs/common';
import { BadRequestException } from '@/common/exceptions';
import { Coupon } from '@/domain/coupon/coupon.entity';
import { COUPON_REPOSITORY, type CouponRepository } from '@/domain/coupon/coupon.repository';
import { UserCouponStatistics } from '@/domain/coupon/user-coupon-statistics.vo';
import { UserCoupon } from '@/domain/coupon/user-coupon.entity';
import { ValidityPeriod } from '@/domain/coupon/validity-period.vo';

@Injectable()
export class CouponService {
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: CouponRepository,
  ) {}

  async issueCoupon(couponId: number, userId: number, issuedAt: Date = new Date()): Promise<UserCoupon> {
    const exists = await this.couponRepository.existsUserCouponByCouponIdAndUserId(couponId, userId);
    if (exists) {
      throw new BadRequestException('이미 발급받은 쿠폰입니다.');
    }

    const coupon = await this.couponRepository.findCouponByIdWithLockOrElseThrow(couponId);
    coupon.issue(issuedAt);

    const userCoupon = UserCoupon.create(
      userId,
      coupon,
      new ValidityPeriod(coupon.getValidityPeriod().getFrom(), coupon.getValidityPeriod().getUntil()),
      issuedAt,
    );

    await this.couponRepository.saveCoupon(coupon);
    await this.couponRepository.saveUserCoupon(userCoupon);

    return userCoupon;
  }

  async getMyCouponsWithStatistics(userId: number, at: Date = new Date()): Promise<UserCouponStatistics> {
    const userCoupons = await this.couponRepository.findUserCouponsByUserId(userId);
    return UserCouponStatistics.fromUserCoupons(userCoupons, at);
  }

  async getCouponInfoByUserCouponId(userCouponId: number): Promise<Coupon> {
    const userCoupon = await this.couponRepository.findUserCouponByIdOrElseThrow(userCouponId);
    return userCoupon.getCoupon();
  }
}
