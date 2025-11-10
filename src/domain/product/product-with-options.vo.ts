import { ProductOption } from './product-option.entity';
import { Product } from './product.entity';

export class ProductWithOptions {
  constructor(
    private readonly product: Product,
    private readonly options: ProductOption[],
  ) {}

  getProduct(): Product {
    return this.product;
  }

  getOptions(): ProductOption[] {
    return this.options;
  }

  findOptionById(optionId: string): ProductOption | undefined {
    return this.options.find((option) => String(option.getProductOptionId()) === optionId.replace('option-', ''));
  }

  hasOptions(): boolean {
    return this.options.length > 0;
  }
}
