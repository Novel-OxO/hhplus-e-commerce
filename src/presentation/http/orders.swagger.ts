import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

export const ApiCreateOrder = () =>
  applyDecorators(
    ApiOperation({ summary: '주문 생성 및 포인트 결제' }),
    ApiResponse({
      status: 201,
      schema: {
        example: {
          orderId: 1,
          status: 'PENDING',
          items: [
            {
              productOptionId: 1,
              sku: 'TSHIRT-RED-M',
              productName: '베이직 티셔츠',
              optionDetails: '빨강/M',
              quantity: 2,
              unitPrice: 29000,
              subtotal: 58000,
            },
            {
              productOptionId: 5,
              sku: 'JEANS-BLUE-32',
              productName: '슬림 청바지',
              optionDetails: '블루/32',
              quantity: 1,
              unitPrice: 45000,
              subtotal: 45000,
            },
          ],
          orderAmount: 103000,
          discountAmount: 10300,
          finalAmount: 92700,
          pointsUsed: 92700,
          coupon: {
            id: 1,
            name: '신규 가입 10% 할인',
            discountType: 'PERCENTAGE',
            discountValue: 10,
          },
          pointBalance: {
            previousBalance: 100000,
            currentBalance: 7300,
          },
          createdAt: '2025-10-28T10:30:00Z',
        },
      },
    }),
  );

export const ApiGetOrder = () =>
  applyDecorators(
    ApiOperation({ summary: '주문 조회' }),
    ApiParam({
      name: 'orderId',
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      schema: {
        example: {
          orderId: 1,
          status: 'PENDING',
          items: [
            {
              productOptionId: 1,
              sku: 'TSHIRT-RED-M',
              productName: '베이직 티셔츠',
              optionDetails: '빨강/M',
              quantity: 2,
              unitPrice: 29000,
              subtotal: 58000,
            },
          ],
          orderAmount: 58000,
          discountAmount: 0,
          finalAmount: 58000,
          pointsUsed: 58000,
          pointBalance: {
            previousBalance: 100000,
            currentBalance: 42000,
          },
          createdAt: '2025-10-28T10:30:00Z',
        },
      },
    }),
  );

export const ApiUpdateOrderStatus = () =>
  applyDecorators(
    ApiOperation({ summary: '주문 상태 변경' }),
    ApiParam({
      name: 'orderId',
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      schema: {
        example: {
          orderId: 1,
          previousStatus: 'PENDING',
          currentStatus: 'COMPLETED',
          updatedAt: '2025-10-28T15:30:00Z',
        },
      },
    }),
  );
