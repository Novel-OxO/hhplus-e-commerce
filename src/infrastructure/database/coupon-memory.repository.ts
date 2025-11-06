import { Injectable } from '@nestjs/common';
import { CouponHistory } from '@/domain/coupon/coupon-history.entity';
import { Coupon } from '@/domain/coupon/coupon.entity';
import { CouponRepository } from '@/domain/coupon/coupon.repository';
import { UserCoupon } from '@/domain/coupon/user-coupon.entity';

@Injectable()
export class CouponMemoryRepository implements CouponRepository {
  private coupons: Map<string, Coupon> = new Map();
  private userCoupons: Map<string, UserCoupon> = new Map();
  private histories: Map<string, CouponHistory> = new Map();

  clear(): void {
    this.coupons.clear();
    this.userCoupons.clear();
    this.histories.clear();
  }

  findCouponById(id: string): Promise<Coupon | null> {
    return Promise.resolve(this.coupons.get(id) || null);
  }

  findAvailableCoupons(at: Date): Promise<Coupon[]> {
    return Promise.resolve(
      Array.from(this.coupons.values()).filter((coupon) => coupon.isValidPeriod(at) && coupon.getQuantity().canIssue()),
    );
  }

  saveCoupon(coupon: Coupon): Promise<void> {
    this.coupons.set(coupon.getId(), coupon);
    return Promise.resolve();
  }

  findCouponByIdWithLock(id: string): Promise<Coupon | null> {
    return Promise.resolve(this.coupons.get(id) || null);
  }

  findUserCouponById(id: string): Promise<UserCoupon | null> {
    return Promise.resolve(this.userCoupons.get(id) || null);
  }

  findUserCouponsByUserId(userId: string): Promise<UserCoupon[]> {
    return Promise.resolve(
      Array.from(this.userCoupons.values()).filter((userCoupon) => userCoupon.getUserId() === userId),
    );
  }

  findAvailableUserCouponsByUserId(userId: string, at: Date): Promise<UserCoupon[]> {
    return Promise.resolve(
      Array.from(this.userCoupons.values()).filter(
        (userCoupon) => userCoupon.getUserId() === userId && !userCoupon.isUsed() && !userCoupon.isExpired(at),
      ),
    );
  }

  existsUserCouponByCouponIdAndUserId(couponId: string, userId: string): Promise<boolean> {
    return Promise.resolve(
      Array.from(this.userCoupons.values()).some(
        (userCoupon) => userCoupon.getCouponId() === couponId && userCoupon.getUserId() === userId,
      ),
    );
  }

  saveUserCoupon(userCoupon: UserCoupon): Promise<void> {
    this.userCoupons.set(userCoupon.getId(), userCoupon);
    return Promise.resolve();
  }

  findHistoriesByUserId(userId: string): Promise<CouponHistory[]> {
    return Promise.resolve(
      Array.from(this.histories.values())
        .filter((history) => history.getUserId() === userId)
        .sort((a, b) => b.getUsedAt().getTime() - a.getUsedAt().getTime()),
    );
  }

  findHistoriesByUserIdWithPagination(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ histories: CouponHistory[]; total: number }> {
    const allHistories = Array.from(this.histories.values())
      .filter((history) => history.getUserId() === userId)
      .sort((a, b) => b.getUsedAt().getTime() - a.getUsedAt().getTime());

    const total = allHistories.length;
    const offset = (page - 1) * limit;
    const histories = allHistories.slice(offset, offset + limit);

    return Promise.resolve({ histories, total });
  }

  saveHistory(history: CouponHistory): Promise<void> {
    this.histories.set(history.getId(), history);
    return Promise.resolve();
  }
}
