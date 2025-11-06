export class ProductRanking {
  private productId: string;
  private totalViews: number;
  private rankingPosition: number;
  private periodDays: number;
  private calculatedAt: Date;

  constructor(
    productId: string,
    totalViews: number,
    rankingPosition: number,
    periodDays: number,
    calculatedAt: Date = new Date(),
  ) {
    this.productId = productId;
    this.totalViews = totalViews;
    this.rankingPosition = rankingPosition;
    this.periodDays = periodDays;
    this.calculatedAt = calculatedAt;
  }

  getProductId(): string {
    return this.productId;
  }

  getTotalViews(): number {
    return this.totalViews;
  }

  getRankingPosition(): number {
    return this.rankingPosition;
  }

  getPeriodDays(): number {
    return this.periodDays;
  }

  getCalculatedAt(): Date {
    return this.calculatedAt;
  }

  isTopRanked(topN: number = 10): boolean {
    return this.rankingPosition <= topN;
  }
}
