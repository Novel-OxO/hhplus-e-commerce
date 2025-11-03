import { CouponHistory } from './coupon-history.entity';
import { Coupon } from './coupon.entity';
import { UserCoupon } from './user-coupon.entity';

export const COUPON_REPOSITORY = Symbol('COUPON_REPOSITORY');

export interface CouponRepository {
  findCouponById(id: string): Promise<Coupon | null>;
  findAvailableCoupons(at: Date): Promise<Coupon[]>;
  saveCoupon(coupon: Coupon): Promise<void>;
  findCouponByIdWithLock(id: string): Promise<Coupon | null>;

  findUserCouponById(id: string): Promise<UserCoupon | null>;
  findUserCouponsByUserId(userId: string): Promise<UserCoupon[]>;
  findAvailableUserCouponsByUserId(userId: string, at: Date): Promise<UserCoupon[]>;
  existsUserCouponByCouponIdAndUserId(couponId: string, userId: string): Promise<boolean>;
  saveUserCoupon(userCoupon: UserCoupon): Promise<void>;

  findHistoriesByUserId(userId: string): Promise<CouponHistory[]>;
  findHistoriesByUserIdWithPagination(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ histories: CouponHistory[]; total: number }>;
  saveHistory(history: CouponHistory): Promise<void>;
}
