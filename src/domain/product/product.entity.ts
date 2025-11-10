export class Product {
  constructor(
    private readonly productId: number,
    private readonly productName: string,
    private readonly description: string,
    private readonly basePrice: number,
    private viewCount: number,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  getProductId(): number {
    return this.productId;
  }

  getProductName(): string {
    return this.productName;
  }

  getDescription(): string {
    return this.description;
  }

  getBasePrice(): number {
    return this.basePrice;
  }

  getViewCount(): number {
    return this.viewCount;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  incrementViewCount(): void {
    this.viewCount++;
  }
}
