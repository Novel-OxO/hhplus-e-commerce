export class CartItem {
  constructor(
    private readonly cartItemId: number,
    private readonly userId: number,
    private readonly productOptionId: number,
    private quantity: number,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  increaseQuantity(amount: number): void {
    this.quantity += amount;
  }

  calculateSubtotal(currentPrice: number): number {
    return currentPrice * this.quantity;
  }

  getCartItemId(): number {
    return this.cartItemId;
  }

  getUserId(): number {
    return this.userId;
  }

  getProductOptionId(): number {
    return this.productOptionId;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
