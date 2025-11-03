export class UserCouponDto {
  userCouponId: string;
  couponId: string;
  issuedAt: Date;
  expiresAt: Date;
  isUsed: boolean;
  isExpired: boolean;
  canUse: boolean;
}

export class GetMyCouponsResponseDto {
  coupons: UserCouponDto[];
  totalCount: number;
  availableCount: number;
  usedCount: number;
  expiredCount: number;
}
