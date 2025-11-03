import { Inject, Injectable } from '@nestjs/common';
import { ProductOption } from '@/domain/product/product-option.entity';
import { ProductWithOptions } from '@/domain/product/product-with-options.vo';
import { Product } from '@/domain/product/product.entity';
import { PRODUCT_REPOSITORY, type ProductRepository } from '@/domain/product/product.repository';
import { NotFoundException } from '@/common/exceptions';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async getProductWithOptions(productId: string): Promise<ProductWithOptions> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    const options = await this.productRepository.findOptionsByProductId(productId);

    return new ProductWithOptions(product, options);
  }

  async getOptionStock(productId: string, optionId: string): Promise<ProductOption> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    const option = await this.productRepository.findOptionById(optionId);

    if (!option) {
      throw new NotFoundException('상품 옵션을 찾을 수 없습니다.');
    }

    if (option.getProductId() !== productId) {
      throw new NotFoundException('해당 상품의 옵션이 아닙니다.');
    }

    return option;
  }

  // TODO: 주문 관련 기능이 구현된 후 인기 상품 조회 로직 개발 예정
  async getPopularProducts(days: number, limit: number): Promise<Product[]> {
    return await this.productRepository.findPopularByPeriod(days, limit);
  }
}
