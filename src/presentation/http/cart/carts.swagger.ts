import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

export const ApiAddCartItem = () =>
  applyDecorators(
    ApiOperation({ summary: '장바구니 상품 옵션 추가' }),
    ApiResponse({
      status: 201,
      schema: {
        example: {
          cartItemId: 1,
          productOption: {
            id: 1,
            sku: 'TSHIRT-RED-M',
            productName: '베이직 티셔츠',
            color: '빨강',
            size: 'M',
            price: 29000,
          },
          quantity: 2,
          currentStock: 150,
        },
      },
    }),
  );

export const ApiGetCart = () =>
  applyDecorators(
    ApiOperation({ summary: '장바구니 조회' }),
    ApiResponse({
      status: 200,
      schema: {
        example: {
          items: [
            {
              cartItemId: 1,
              productOption: {
                id: 1,
                sku: 'TSHIRT-RED-M',
                productId: 1,
                productName: '베이직 티셔츠',
                color: '빨강',
                size: 'M',
                price: 29000,
              },
              quantity: 2,
              savedPrice: 29000,
              currentPrice: 29000,
              currentStock: 150,
              isPriceChanged: false,
              isStockSufficient: true,
              subtotal: 58000,
            },
          ],
          totalAmount: 58000,
          totalItems: 1,
        },
      },
    }),
  );

export const ApiDeleteCartItem = () =>
  applyDecorators(
    ApiOperation({ summary: '장바구니 상품 옵션 삭제' }),
    ApiParam({
      name: 'itemId',
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      schema: {
        example: {
          message: '장바구니 항목이 삭제되었습니다',
          deletedItemId: 1,
        },
      },
    }),
  );

export const ApiClearCart = () =>
  applyDecorators(
    ApiOperation({ summary: '장바구니 전체 삭제' }),
    ApiResponse({
      status: 200,
      schema: {
        example: {
          message: '장바구니가 비워졌습니다',
          deletedCount: 3,
        },
      },
    }),
  );
