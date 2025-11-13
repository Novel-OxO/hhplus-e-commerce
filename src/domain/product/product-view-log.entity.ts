import { Product } from './product.entity';

export class ProductViewLog {
  private logId?: number;
  private productId: number;
  private userId?: number;
  private viewedAt: Date;

  constructor(productId: number, userId?: number, viewedAt: Date = new Date(), logId?: number) {
    this.logId = logId;
    this.productId = productId;
    this.userId = userId;
    this.viewedAt = viewedAt;
  }

  static create(product: Product, userId?: number, viewedAt: Date = new Date()): ProductViewLog {
    return new ProductViewLog(product.getProductId(), userId, viewedAt);
  }

  getLogId(): number | undefined {
    return this.logId;
  }

  getProductId(): number {
    return this.productId;
  }

  getUserId(): number | undefined {
    return this.userId;
  }

  getViewedAt(): Date {
    return this.viewedAt;
  }
}
