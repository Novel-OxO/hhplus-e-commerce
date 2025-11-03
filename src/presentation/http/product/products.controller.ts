import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from '@/application/product.service';
import { GetPopularProductsResponseDto } from '@/presentation/http/product/dto/popular-products-response.dto';
import { GetProductDetailResponseDto } from '@/presentation/http/product/dto/product-response.dto';
import { GetProductStockResponseDto } from '@/presentation/http/product/dto/product-stock-response.dto';
import {
  ApiGetProductDetail,
  ApiGetOptionStock,
  ApiGetPopularProducts,
} from '@/presentation/http/product/products.swagger';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductService) {}

  @Get('popular')
  @ApiGetPopularProducts()
  async getPopularProducts(
    @Query('days') days: string,
    @Query('limit') limit: string,
  ): Promise<GetPopularProductsResponseDto> {
    // TODO Step6 고도화 예정
    const daysNum = parseInt(days, 10) || 3;
    const limitNum = parseInt(limit, 10) || 5;

    const products = await this.productService.getPopularProducts(daysNum, limitNum);

    return {
      products: products.map((p) => ({
        id: p.getId(),
        name: p.getName(),
        description: p.getDescription(),
        price: p.getPrice(),
      })),
      period: {
        days: daysNum,
      },
    };
  }

  @Get(':id')
  @ApiGetProductDetail()
  async getProductDetail(@Param('id') id: string): Promise<GetProductDetailResponseDto> {
    const productWithOptions = await this.productService.getProductWithOptions(id);
    const product = productWithOptions.getProduct();
    const options = productWithOptions.getOptions();

    return {
      product: {
        id: product.getId(),
        name: product.getName(),
        description: product.getDescription(),
        price: product.getPrice(),
        options: options.map((opt) => ({
          id: opt.getId(),
          productId: opt.getProductId(),
          name: opt.getName(),
          additionalPrice: opt.getAdditionalPrice(),
          stock: opt.getStock(),
        })),
      },
    };
  }

  @Get(':id/options/:optionId/stock')
  @ApiGetOptionStock()
  async getOptionStock(
    @Param('id') id: string,
    @Param('optionId') optionId: string,
  ): Promise<GetProductStockResponseDto> {
    const option = await this.productService.getOptionStock(id, optionId);

    return {
      optionId: option.getId(),
      productId: option.getProductId(),
      name: option.getName(),
      stock: option.getStock(),
      isAvailable: option.getStock() > 0,
    };
  }
}
