import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

export const ApiGetProductDetail = () =>
  applyDecorators(
    ApiOperation({ summary: '상품 정보 조회' }),
    ApiParam({
      name: 'id',
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      schema: {
        example: {
          id: 1,
          name: '베이직 티셔츠',
          description: '편안한 면 소재',
          basePrice: 29000,
          category: '상의',
          options: [
            {
              id: 1,
              sku: 'TSHIRT-RED-M',
              color: '빨강',
              size: 'M',
              price: 29000,
              stock: 150,
            },
            {
              id: 2,
              sku: 'TSHIRT-BLUE-L',
              color: '파랑',
              size: 'L',
              price: 29000,
              stock: 80,
            },
          ],
        },
      },
    }),
  );

export const ApiGetProductOptions = () =>
  applyDecorators(
    ApiOperation({ summary: '상품 옵션 목록 조회' }),
    ApiParam({
      name: 'id',
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: 'color',
      required: false,
      type: String,
      example: '빨강',
    }),
    ApiQuery({
      name: 'size',
      required: false,
      type: String,
      example: 'M',
    }),
    ApiResponse({
      status: 200,
      schema: {
        example: {
          productId: 1,
          options: [
            {
              id: 1,
              sku: 'TSHIRT-RED-M',
              color: '빨강',
              size: 'M',
              price: 29000,
              stock: 150,
            },
            {
              id: 2,
              sku: 'TSHIRT-BLUE-L',
              color: '파랑',
              size: 'L',
              price: 29000,
              stock: 80,
            },
          ],
        },
      },
    }),
  );

export const ApiGetOptionStock = () =>
  applyDecorators(
    ApiOperation({ summary: '재고 실시간 확인' }),
    ApiParam({
      name: 'id',
      type: Number,
      example: 1,
    }),
    ApiParam({
      name: 'optionId',
      type: Number,
      example: 1,
    }),
    ApiResponse({
      status: 200,
      schema: {
        example: {
          optionId: 1,
          sku: 'TSHIRT-RED-M',
          stock: 150,
          isAvailable: true,
        },
      },
    }),
  );

export const ApiGetPopularProducts = () =>
  applyDecorators(
    ApiOperation({ summary: '인기 상품 조회' }),
    ApiQuery({
      name: 'days',
      required: false,
      type: Number,
      example: 3,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      example: 5,
    }),
    ApiResponse({
      status: 200,
      schema: {
        example: {
          products: [
            {
              id: 5,
              name: '오버핏 후드',
              basePrice: 45000,
              viewCount: 1523,
              thumbnailUrl: 'https://example.com/image.jpg',
            },
            {
              id: 12,
              name: '슬림핏 청바지',
              basePrice: 59000,
              viewCount: 1402,
              thumbnailUrl: 'https://example.com/image2.jpg',
            },
          ],
          period: {
            days: 3,
            from: '2025-10-25T00:00:00Z',
            to: '2025-10-28T23:59:59Z',
          },
        },
      },
    }),
  );
