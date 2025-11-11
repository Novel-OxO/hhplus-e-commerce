import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductRankingService } from '@/application/product/product-ranking.service';
import { ProductService } from '@/application/product/product.service';
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
  constructor(
    private readonly productService: ProductService,
    private readonly productRankingService: ProductRankingService,
  ) {}

  @Get('popular')
  @ApiGetPopularProducts()
  async getPopularProducts(@Query('limit') limit: string): Promise<GetPopularProductsResponseDto> {
    const limitNum = parseInt(limit, 10) || 5;
    const products = await this.productRankingService.getTopRankings(new Date(), limitNum);

    return {
      products: products.map((p) => ({
        id: p.getProductId(),
        name: p.getProduct().getProductName(),
        description: p.getProduct().getDescription(),
        price: p.getProduct().getBasePrice(),
      })),
      period: {
        days: 3,
      },
    };
  }

  @Get(':id')
  @ApiGetProductDetail()
  async getProductDetail(@Param('id') id: string): Promise<GetProductDetailResponseDto> {
    const productId = parseInt(id, 10);
    const productWithOptions = await this.productService.getProductWithOptions(productId);
    const product = productWithOptions.getProduct();
    const options = productWithOptions.getOptions();

    return {
      product: {
        id: product.getProductId(),
        name: product.getProductName(),
        description: product.getDescription(),
        price: product.getBasePrice(),
        options: options.map((opt) => ({
          id: opt.getProductOptionId(),
          productId: opt.getProductId(),
          name: opt.getOptionName(),
          sku: opt.getSku(),
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
    const productId = parseInt(id, 10);
    const optionIdNum = parseInt(optionId, 10);
    const option = await this.productService.getOptionStock(productId, optionIdNum);

    return {
      optionId: String(option.getProductOptionId()),
      productId: option.getProductId(),
      name: option.getOptionName(),
      stock: option.getStock(),
      isAvailable: option.getStock() > 0,
    };
  }
}
