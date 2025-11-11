import { Inject, Injectable } from '@nestjs/common';
import { ProductOption } from '@/domain/product/product-option.entity';
import { ProductWithOptions } from '@/domain/product/product-with-options.vo';
import { PRODUCT_REPOSITORY, type ProductRepository } from '@/domain/product/product.repository';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async getProductWithOptions(productId: number): Promise<ProductWithOptions> {
    const result = await this.productRepository.findWithOptionsByProductIdOrElseThrow(productId);
    return result;
  }

  async getOptionStock(productId: number, optionId: number): Promise<ProductOption> {
    return await this.productRepository.findOptionByOptionIdAndProductIdOrElseThrow(optionId, productId);
  }

  async findOptionByIdOrElseThrow(optionId: number): Promise<ProductOption> {
    return await this.productRepository.findOptionByIdOrElseThrow(optionId);
  }
}
