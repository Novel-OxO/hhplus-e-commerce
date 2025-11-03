import { ProductOption } from './product-option.entity';
import { Product } from './product.entity';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepository {
  findById(productId: string): Promise<Product | null>;

  findOptionsByProductId(productId: string): Promise<ProductOption[]>;

  findOptionById(optionId: string): Promise<ProductOption | null>;

  findPopularByPeriod(days: number, limit: number): Promise<Product[]>;

  saveProduct(product: Product): Promise<Product>;

  saveOption(option: ProductOption): Promise<ProductOption>;

  findOptionByIdWithLock(optionId: string): Promise<ProductOption | null>;
}
