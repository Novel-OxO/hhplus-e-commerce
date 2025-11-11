import { Coupon } from './coupon.entity';
import { UserCoupon } from './user-coupon.entity';

export const COUPON_REPOSITORY = Symbol('COUPON_REPOSITORY');

export interface CouponRepository {
  findCouponById(id: number): Promise<Coupon | null>;
  findAvailableCoupons(at: Date): Promise<Coupon[]>;
  saveCoupon(coupon: Coupon): Promise<void>;
  findCouponByIdWithLock(id: number): Promise<Coupon | null>;
  findCouponByIdWithLockOrElseThrow(id: number): Promise<Coupon>;

  findUserCouponById(id: number): Promise<UserCoupon | null>;
  findUserCouponByIdOrElseThrow(id: number): Promise<UserCoupon>;
  findCouponByUserCouponIdOrElseThrow(userCouponId: number): Promise<Coupon>;
  findUserCouponsByUserId(userId: number): Promise<UserCoupon[]>;
  findAvailableUserCouponsByUserId(userId: number, at: Date): Promise<UserCoupon[]>;
  existsUserCouponByCouponIdAndUserId(couponId: number, userId: number): Promise<boolean>;
  saveUserCoupon(userCoupon: UserCoupon): Promise<void>;
}
