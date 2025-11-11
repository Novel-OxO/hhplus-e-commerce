import { ProductOption } from './product-option.entity';
import { Product } from './product.entity';

/**
 * 상품 옵션에 상품 정보를 포함한 Value Object
 * 주문 생성 시 상품명을 포함한 전체 정보가 필요할 때 사용
 */
export class ProductDetail {
  constructor(
    private readonly product: Product,
    private readonly option: ProductOption,
  ) {}

  static from(product: Product, option: ProductOption): ProductDetail {
    return new ProductDetail(product, option);
  }

  getProductOptionId(): number {
    return this.option.getProductOptionId();
  }

  getProductId(): number {
    return this.option.getProductId();
  }

  getProductName(): string {
    return this.product.getProductName();
  }

  getOptionName(): string {
    return this.option.getOptionName();
  }

  getSku(): string {
    return this.option.getSku();
  }

  getPrice(): number {
    return this.option.getPrice();
  }

  getStock(): number {
    return this.option.getStock();
  }

  canOrder(quantity: number): boolean {
    return this.option.canOrder(quantity);
  }

  decreaseStock(quantity: number): void {
    this.option.decreaseStock(quantity);
  }

  increaseStock(quantity: number): void {
    this.option.increaseStock(quantity);
  }

  getOption(): ProductOption {
    return this.option;
  }

  getProduct(): Product {
    return this.product;
  }
}
