export class CartItem {
  constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly productOptionId: string,
    private quantity: number,
    private readonly savedPrice: number,
    private readonly createdAt: Date,
  ) {}

  increaseQuantity(amount: number): void {
    this.quantity += amount;
  }

  isPriceChanged(currentPrice: number): boolean {
    return this.savedPrice !== currentPrice;
  }

  calculateSubtotal(currentPrice: number): number {
    return currentPrice * this.quantity;
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getProductOptionId(): string {
    return this.productOptionId;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getSavedPrice(): number {
    return this.savedPrice;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
