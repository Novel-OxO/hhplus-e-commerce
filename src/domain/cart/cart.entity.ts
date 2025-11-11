import { CartItem } from './cart-item.entity';

export class Cart {
  private constructor(private readonly items: CartItem[]) {}

  static create(cartItems: CartItem[]): Cart {
    return new Cart(cartItems);
  }

  static empty(): Cart {
    return new Cart([]);
  }

  getItems(): CartItem[] {
    return this.items;
  }

  calculateTotalAmount(): number {
    return this.items.reduce((sum, cartItem) => {
      return sum + cartItem.calculateSubtotal();
    }, 0);
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  getItemCount(): number {
    return this.items.length;
  }
}
