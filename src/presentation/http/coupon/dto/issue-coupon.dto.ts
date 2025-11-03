export class IssueCouponRequestDto {
  userId: string;
}

export class IssueCouponResponseDto {
  userCouponId: string;
  couponId: string;
  userId: string;
  issuedAt: Date;
  expiresAt: Date;
  isUsed: boolean;
  message: string;
}
