export class ProductDailyView {
  private productId: string;
  private viewDate: string; // YYYY-MM-DD 형식
  private viewCount: number;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(
    productId: string,
    viewDate: string,
    viewCount: number = 0,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    this.productId = productId;
    this.viewDate = viewDate;
    this.viewCount = viewCount;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  getProductId(): string {
    return this.productId;
  }

  getViewDate(): string {
    return this.viewDate;
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
    this.updatedAt = new Date();
  }

  static createKey(productId: string, viewDate: string): string {
    return `${productId}:${viewDate}`;
  }

  getKey(): string {
    return ProductDailyView.createKey(this.productId, this.viewDate);
  }
}
