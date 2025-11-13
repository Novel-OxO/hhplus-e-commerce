import { Inject, Injectable } from '@nestjs/common';
import { ProductRankingAggregator } from '@/domain/product/product-ranking.aggregator';
import { ProductRanking } from '@/domain/product/product-ranking.entity';
import { ProductViewLog } from '@/domain/product/product-view-log.entity';
import { PRODUCT_REPOSITORY, type ProductRepository } from '@/domain/product/product.repository';

@Injectable()
export class ProductRankingService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    private readonly productRankingAggregator: ProductRankingAggregator,
  ) {}

  async calculateRankings(targetDate: Date = new Date()): Promise<ProductRanking[]> {
    const viewCounts = await this.productRepository.aggregateViewsForDate(targetDate);
    if (viewCounts.length === 0) {
      return [];
    }

    const products = await this.productRepository.findProductsByIds(viewCounts.map((vc) => vc.getProductId()));
    const rankings = this.productRankingAggregator.aggregate(viewCounts, products, targetDate);
    const savedRankings = await Promise.all(rankings.map((ranking) => this.productRepository.saveRanking(ranking)));

    return savedRankings;
  }

  async getTopRankings(targetDate: Date = new Date(), limit: number = 10): Promise<ProductRanking[]> {
    const rankings = await this.productRepository.findRankingsByDate(targetDate, limit);

    return rankings;
  }

  async recordProductView(productId: number, userId?: number, targetDate: Date = new Date()): Promise<void> {
    const product = await this.productRepository.findByIdOrElseThrow(productId);
    const viewLog = ProductViewLog.create(product, userId, targetDate);

    await this.productRepository.saveViewLog(viewLog);
  }
}
