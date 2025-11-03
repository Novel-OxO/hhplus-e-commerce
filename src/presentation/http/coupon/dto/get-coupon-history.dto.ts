export class CouponHistoryDto {
  userCouponId: string;
  couponId: string;
  issuedAt: Date;
  usedAt: Date;
}

export class GetCouponHistoryResponseDto {
  history: CouponHistoryDto[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}
