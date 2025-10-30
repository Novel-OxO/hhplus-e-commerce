import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetMyCoupons,
  ApiGetMyCouponHistory,
  ApiIssueCoupon,
} from './coupons.swagger';

@ApiTags('Coupons')
@Controller()
export class CouponsController {
  @Post('coupons/:couponId/issue')
  @ApiIssueCoupon()
  issueCoupon(
    @Param('couponId') couponId: string,
    @Body() body: { userId: number },
  ) {
    console.log('Issue coupon request:', { couponId, ...body });
    return {
      userCouponId: 1,
      coupon: {
        id: 1,
        name: '신규 가입 10% 할인',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        maxDiscountAmount: 10000,
        minOrderAmount: 30000,
        expiresAt: '2025-11-28T23:59:59Z',
      },
      issuedAt: '2025-10-28T10:30:00Z',
      expiresAt: '2025-11-28T23:59:59Z',
      isUsed: false,
      remainingQuantity: 49,
      message: '쿠폰이 발급되었습니다',
    };
  }

  @Get('users/me/coupons')
  @ApiGetMyCoupons()
  getMyCoupons(@Query('status') status: string) {
    console.log('Get my coupons request:', { status });
    return {
      coupons: [
        {
          userCouponId: 1,
          coupon: {
            id: 1,
            name: '신규 가입 10% 할인',
            discountType: 'PERCENTAGE',
            discountValue: 10,
            maxDiscountAmount: 10000,
            minOrderAmount: 30000,
          },
          issuedAt: '2025-10-28T10:30:00Z',
          expiresAt: '2025-11-28T23:59:59Z',
          isUsed: false,
          isExpired: false,
          canUse: true,
        },
        {
          userCouponId: 2,
          coupon: {
            id: 2,
            name: '첫 구매 5000원 할인',
            discountType: 'FIXED',
            discountValue: 5000,
            minOrderAmount: 50000,
          },
          issuedAt: '2025-10-27T15:00:00Z',
          expiresAt: '2025-11-27T23:59:59Z',
          isUsed: false,
          isExpired: false,
          canUse: true,
        },
      ],
      totalCount: 2,
      availableCount: 2,
      usedCount: 0,
      expiredCount: 0,
    };
  }

  @Get('users/me/coupons/history')
  @ApiGetMyCouponHistory()
  getMyCouponHistory(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    console.log('Get coupon history request:', { page, limit });
    return {
      history: [
        {
          userCouponId: 5,
          coupon: {
            id: 1,
            name: '신규 가입 10% 할인',
            discountType: 'PERCENTAGE',
            discountValue: 10,
          },
          issuedAt: '2025-10-28T10:30:00Z',
          usedAt: '2025-10-28T14:30:00Z',
        },
        {
          userCouponId: 3,
          coupon: {
            id: 2,
            name: '첫 구매 5000원 할인',
            discountType: 'FIXED',
            discountValue: 5000,
          },
          issuedAt: '2025-10-27T15:00:00Z',
          usedAt: '2025-10-27T18:20:00Z',
        },
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 2,
        limit: 10,
      },
    };
  }
}
