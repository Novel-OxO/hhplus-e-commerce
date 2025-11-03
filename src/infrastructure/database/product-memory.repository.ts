import { Injectable } from '@nestjs/common';
import { ProductOption } from '@/domain/product/product-option.entity';
import { Product } from '@/domain/product/product.entity';
import { ProductRepository } from '@/domain/product/product.repository';

@Injectable()
export class ProductMemoryRepository implements ProductRepository {
  private products: Map<string, Product> = new Map();
  private options: Map<string, ProductOption> = new Map();

  findById(productId: string): Promise<Product | null> {
    return Promise.resolve(this.products.get(productId) || null);
  }

  findOptionsByProductId(productId: string): Promise<ProductOption[]> {
    return Promise.resolve(Array.from(this.options.values()).filter((option) => option.getProductId() === productId));
  }

  findOptionById(optionId: string): Promise<ProductOption | null> {
    return Promise.resolve(this.options.get(optionId) || null);
  }
  // TODO 인기 상품 구현 조회는 주문 관련 기능이 구현 된 후에 개발 예정
  findPopularByPeriod(days: number, limit: number): Promise<Product[]> {
    const products = Array.from(this.products.values());
    return Promise.resolve(products.slice(0, limit));
  }

  saveOption(option: ProductOption): Promise<ProductOption> {
    this.options.set(option.getId(), option);
    return Promise.resolve(option);
  }

  findOptionByIdWithLock(optionId: string): Promise<ProductOption | null> {
    return Promise.resolve(this.options.get(optionId) || null);
  }

  saveProduct(product: Product): Promise<Product> {
    this.products.set(product.getId(), product);
    return Promise.resolve(product);
  }
}
