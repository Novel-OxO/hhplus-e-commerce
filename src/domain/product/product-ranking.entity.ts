import { Product } from './product.entity';

export class ProductRanking {
  private product: Product;
  private totalViews: number;
  private rankingPosition: number;
  private calculatedAt: Date;

  constructor(product: Product, totalViews: number, rankingPosition: number, calculatedAt: Date = new Date()) {
    this.product = product;
    this.totalViews = totalViews;
    this.rankingPosition = rankingPosition;
    this.calculatedAt = calculatedAt;
  }

  getProduct(): Product {
    return this.product;
  }

  getProductId(): number {
    return this.product.getProductId();
  }

  getTotalViews(): number {
    return this.totalViews;
  }

  getRankingPosition(): number {
    return this.rankingPosition;
  }

  getCalculatedAt(): Date {
    return this.calculatedAt;
  }

  isTopRanked(topN: number = 10): boolean {
    return this.rankingPosition <= topN;
  }
}
