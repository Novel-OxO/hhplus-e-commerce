import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CouponService } from '@/application/coupon/coupon.service';
import { ApiGetMyCoupons, ApiIssueCoupon } from '@/presentation/http/coupon/coupons.swagger';
import { GetMyCouponsResponseDto } from '@/presentation/http/coupon/dto/get-my-coupons.dto';
import { IssueCouponRequestDto, IssueCouponResponseDto } from '@/presentation/http/coupon/dto/issue-coupon.dto';

@ApiTags('Coupons')
@Controller()
export class CouponsController {
  constructor(private readonly couponService: CouponService) {}

  @Post('coupons/:couponId/issue')
  @ApiIssueCoupon()
  async issueCoupon(
    @Param('couponId') couponId: string,
    @Body() body: IssueCouponRequestDto,
  ): Promise<IssueCouponResponseDto> {
    const numericCouponId = parseInt(couponId, 10);
    const numericUserId = parseInt(body.userId, 10);
    const userCoupon = await this.couponService.issueCoupon(numericCouponId, numericUserId);

    return {
      userCouponId: userCoupon.getId()?.toString() ?? '',
      couponId: userCoupon.getCoupon().getId()?.toString() ?? '',
      userId: userCoupon.getUserId().toString(),
      issuedAt: userCoupon.getIssuedAt(),
      expiresAt: userCoupon.getValidityPeriod().getUntil(),
      isUsed: userCoupon.isUsed(),
      message: '쿠폰이 발급되었습니다',
    };
  }

  @Get('users/me/coupons')
  @ApiGetMyCoupons()
  async getMyCoupons(
    @Query('userId') userId: string,
    @Query('status') status?: string,
  ): Promise<GetMyCouponsResponseDto> {
    const now = new Date();
    const numericUserId = parseInt(userId, 10);

    const statistics = await this.couponService.getMyCouponsWithStatistics(numericUserId, now);
    const filteredCoupons = statistics.filterByStatus(status, now);

    return {
      coupons: filteredCoupons.map((uc) => ({
        userCouponId: uc.getId()?.toString() ?? '',
        couponId: uc.getCoupon().getId()?.toString() ?? '',
        issuedAt: uc.getIssuedAt(),
        expiresAt: uc.getValidityPeriod().getUntil(),
        isUsed: uc.isUsed(),
        isExpired: uc.isExpired(now),
        canUse: !uc.isUsed() && !uc.isExpired(now),
      })),
      totalCount: statistics.getTotalCount(),
      availableCount: statistics.getAvailableCount(),
      usedCount: statistics.getUsedCount(),
      expiredCount: statistics.getExpiredCount(),
    };
  }
}
