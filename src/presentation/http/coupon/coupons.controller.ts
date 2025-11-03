import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CouponService } from '@/application/coupon.service';
import { ApiGetMyCouponHistory, ApiGetMyCoupons, ApiIssueCoupon } from '@/presentation/http/coupon/coupons.swagger';
import { GetCouponHistoryResponseDto } from '@/presentation/http/coupon/dto/get-coupon-history.dto';
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
    const userCoupon = await this.couponService.issueCoupon(couponId, body.userId);

    return {
      userCouponId: userCoupon.getId(),
      couponId: userCoupon.getCouponId(),
      userId: userCoupon.getUserId(),
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

    const statistics = await this.couponService.getMyCouponsWithStatistics(userId, now);
    const filteredCoupons = statistics.filterByStatus(status, now);

    return {
      coupons: filteredCoupons.map((uc) => ({
        userCouponId: uc.getId(),
        couponId: uc.getCouponId(),
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

  @Get('users/me/coupons/history')
  @ApiGetMyCouponHistory()
  async getMyCouponHistory(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('userId') userId: string,
  ): Promise<GetCouponHistoryResponseDto> {
    // TODO Page 관련 로직은 추후 고도화 예정
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const { histories, total } = await this.couponService.getMyCouponHistoryWithPagination(userId, pageNum, limitNum);

    const totalPages = Math.ceil(total / limitNum);

    return {
      history: histories.map((h) => ({
        userCouponId: h.getUserCouponId(),
        couponId: h.getCouponId(),
        issuedAt: h.getUsedAt(),
        usedAt: h.getUsedAt(),
      })),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount: total,
        limit: limitNum,
      },
    };
  }
}
