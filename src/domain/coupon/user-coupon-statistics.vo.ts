import { UserCoupon } from './user-coupon.entity';

export class UserCouponStatistics {
  constructor(
    private readonly coupons: UserCoupon[],
    private readonly totalCount: number,
    private readonly availableCount: number,
    private readonly usedCount: number,
    private readonly expiredCount: number,
  ) {}

  static fromUserCoupons(userCoupons: UserCoupon[], at: Date): UserCouponStatistics {
    const totalCount = userCoupons.length;
    const availableCount = userCoupons.filter((uc) => !uc.isUsed() && !uc.isExpired(at)).length;
    const usedCount = userCoupons.filter((uc) => uc.isUsed()).length;
    const expiredCount = userCoupons.filter((uc) => uc.isExpired(at) && !uc.isUsed()).length;

    return new UserCouponStatistics(userCoupons, totalCount, availableCount, usedCount, expiredCount);
  }

  filterByStatus(status: string | undefined, at: Date): UserCoupon[] {
    if (status === 'AVAILABLE') {
      return this.coupons.filter((uc) => !uc.isUsed() && !uc.isExpired(at));
    }
    if (status === 'USED') {
      return this.coupons.filter((uc) => uc.isUsed());
    }
    if (status === 'EXPIRED') {
      return this.coupons.filter((uc) => uc.isExpired(at) && !uc.isUsed());
    }
    return this.coupons;
  }

  getCoupons(): UserCoupon[] {
    return this.coupons;
  }

  getTotalCount(): number {
    return this.totalCount;
  }

  getAvailableCount(): number {
    return this.availableCount;
  }

  getUsedCount(): number {
    return this.usedCount;
  }

  getExpiredCount(): number {
    return this.expiredCount;
  }
}
