export class ProductViewLog {
  private logId: string;
  private productId: string;
  private userId?: string;
  private viewedAt: Date;

  constructor(logId: string, productId: string, userId?: string, viewedAt: Date = new Date()) {
    this.logId = logId;
    this.productId = productId;
    this.userId = userId;
    this.viewedAt = viewedAt;
  }

  getLogId(): string {
    return this.logId;
  }

  getProductId(): string {
    return this.productId;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  getViewedAt(): Date {
    return this.viewedAt;
  }
}
