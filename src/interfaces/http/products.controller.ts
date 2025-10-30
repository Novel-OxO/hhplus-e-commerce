import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetProductDetail,
  ApiGetProductOptions,
  ApiGetOptionStock,
  ApiGetPopularProducts,
} from './products.swagger';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  @Get('popular')
  @ApiGetPopularProducts()
  getPopularProducts(
    @Query('days') days: string,
    @Query('limit') limit: string,
  ) {
    console.log('Get popular products request:', { days, limit });
    return {
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
        {
          id: 3,
          name: '베이직 티셔츠',
          basePrice: 29000,
          viewCount: 1356,
          thumbnailUrl: 'https://example.com/image3.jpg',
        },
        {
          id: 8,
          name: '와이드 팬츠',
          basePrice: 52000,
          viewCount: 1204,
          thumbnailUrl: 'https://example.com/image4.jpg',
        },
        {
          id: 15,
          name: '크롭 맨투맨',
          basePrice: 38000,
          viewCount: 1156,
          thumbnailUrl: 'https://example.com/image5.jpg',
        },
      ],
      period: {
        days: parseInt(days) || 3,
        from: '2025-10-25T00:00:00Z',
        to: '2025-10-28T23:59:59Z',
      },
    };
  }

  @Get(':id')
  @ApiGetProductDetail()
  getProductDetail(@Param('id') id: string) {
    console.log('Get product detail request:', { id });
    return {
      id: parseInt(id),
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
        {
          id: 3,
          sku: 'TSHIRT-RED-L',
          color: '빨강',
          size: 'L',
          price: 29000,
          stock: 120,
        },
        {
          id: 4,
          sku: 'TSHIRT-BLUE-M',
          color: '파랑',
          size: 'M',
          price: 29000,
          stock: 95,
        },
      ],
    };
  }

  @Get(':id/options')
  @ApiGetProductOptions()
  getProductOptions(
    @Param('id') id: string,
    @Query('color') color: string,
    @Query('size') size: string,
  ) {
    console.log('Get product options request:', { id, color, size });
    return {
      productId: parseInt(id),
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
    };
  }

  @Get(':id/options/:optionId/stock')
  @ApiGetOptionStock()
  getOptionStock(@Param('id') id: string, @Param('optionId') optionId: string) {
    console.log('Get option stock request:', { id, optionId });
    return {
      optionId: parseInt(optionId),
      sku: 'TSHIRT-RED-M',
      stock: 150,
      isAvailable: true,
    };
  }
}
