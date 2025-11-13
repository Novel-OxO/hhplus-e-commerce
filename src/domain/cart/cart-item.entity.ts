import { ProductOption } from '@/domain/product/product-option.entity';
import { ProductQuantity } from '@/domain/product/product-quantity.vo';

export class CartItem {
  constructor(
    private readonly userId: number,
    private readonly productOption: ProductOption,
    private quantity: ProductQuantity,
    private readonly price: number,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
    private cartItemId?: number,
  ) {}

  static create(
    userId: number,
    productOption: ProductOption,
    quantity: ProductQuantity,
    price: number,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    return new CartItem(userId, productOption, quantity, price, createdAt, updatedAt, undefined);
  }

  increaseQuantity(amount: ProductQuantity): void {
    this.quantity = this.quantity.increase(amount.getValue());
  }

  calculateSubtotal(): number {
    return this.price * this.quantity.getValue();
  }

  getPrice(): number {
    return this.price;
  }

  getCartItemId(): number | undefined {
    return this.cartItemId;
  }

  getUserId(): number {
    return this.userId;
  }

  getProductOption(): ProductOption {
    return this.productOption;
  }

  getQuantity(): ProductQuantity {
    return this.quantity;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
