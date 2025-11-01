import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

export const ApiIssueCoupon = () =>
  applyDecorators(
    ApiOperation({ summary: '선착순 쿠폰 발급' }),
    ApiParam({ name: 'couponId', description: '쿠폰 ID', example: 1 }),
    ApiBody({
      schema: {
        properties: {
          userId: { type: 'number', example: 100 },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: '쿠폰 발급 성공',
      schema: {
        properties: {
          userCouponId: { type: 'number', example: 1 },
          coupon: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: '신규 가입 10% 할인' },
              discountType: { type: 'string', example: 'PERCENTAGE' },
              discountValue: { type: 'number', example: 10 },
              maxDiscountAmount: { type: 'number', example: 10000 },
              minOrderAmount: { type: 'number', example: 30000 },
              expiresAt: { type: 'string', example: '2025-11-28T23:59:59Z' },
            },
          },
          issuedAt: { type: 'string', example: '2025-10-28T10:30:00Z' },
          expiresAt: { type: 'string', example: '2025-11-28T23:59:59Z' },
          isUsed: { type: 'boolean', example: false },
          remainingQuantity: { type: 'number', example: 49 },
          message: { type: 'string', example: '쿠폰이 발급되었습니다' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '쿠폰 발급 실패 (수량 소진, 중복 발급 등)',
    }),
  );

export const ApiGetMyCoupons = () =>
  applyDecorators(
    ApiOperation({ summary: '내 쿠폰 목록 조회' }),
    ApiQuery({
      name: 'status',
      required: false,
      description: '쿠폰 상태 필터',
      enum: ['AVAILABLE', 'USED', 'EXPIRED', 'ALL'],
      example: 'AVAILABLE',
    }),
    ApiResponse({
      status: 200,
      description: '쿠폰 목록 조회 성공',
      schema: {
        properties: {
          coupons: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                userCouponId: { type: 'number', example: 1 },
                coupon: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 1 },
                    name: { type: 'string', example: '신규 가입 10% 할인' },
                    discountType: { type: 'string', example: 'PERCENTAGE' },
                    discountValue: { type: 'number', example: 10 },
                    maxDiscountAmount: { type: 'number', example: 10000 },
                    minOrderAmount: { type: 'number', example: 30000 },
                  },
                },
                issuedAt: { type: 'string', example: '2025-10-28T10:30:00Z' },
                expiresAt: { type: 'string', example: '2025-11-28T23:59:59Z' },
                isUsed: { type: 'boolean', example: false },
                isExpired: { type: 'boolean', example: false },
                canUse: { type: 'boolean', example: true },
              },
            },
          },
          totalCount: { type: 'number', example: 2 },
          availableCount: { type: 'number', example: 2 },
          usedCount: { type: 'number', example: 0 },
          expiredCount: { type: 'number', example: 0 },
        },
      },
    }),
  );

export const ApiGetMyCouponHistory = () =>
  applyDecorators(
    ApiOperation({ summary: '쿠폰 사용 이력 조회' }),
    ApiQuery({
      name: 'page',
      required: false,
      description: '페이지 번호',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: '페이지당 항목 수',
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: '쿠폰 사용 이력 조회 성공',
      schema: {
        properties: {
          history: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                userCouponId: { type: 'number', example: 5 },
                coupon: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 1 },
                    name: { type: 'string', example: '신규 가입 10% 할인' },
                    discountType: { type: 'string', example: 'PERCENTAGE' },
                    discountValue: { type: 'number', example: 10 },
                  },
                },
                issuedAt: { type: 'string', example: '2025-10-28T10:30:00Z' },
                usedAt: { type: 'string', example: '2025-10-28T14:30:00Z' },
              },
            },
          },
          pagination: {
            type: 'object',
            properties: {
              currentPage: { type: 'number', example: 1 },
              totalPages: { type: 'number', example: 1 },
              totalCount: { type: 'number', example: 2 },
              limit: { type: 'number', example: 10 },
            },
          },
        },
      },
    }),
  );
