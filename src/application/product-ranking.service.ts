import { Inject, Injectable } from '@nestjs/common';
import { formatDate, getDateDaysAgo } from '@/common/utils/date.util';
import { ProductRanking } from '@/domain/product/product-ranking.entity';
import { PRODUCT_REPOSITORY, type ProductRepository } from '@/domain/product/product.repository';

@Injectable()
export class ProductRankingService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  /**
   * 지정된 기간 동안의 상품 조회수를 집계하여 랭킹을 계산합니다.
   *
   * @param periodDays 집계 기간 (일)
   * @returns 계산된 랭킹 목록
   */
  async calculateRankings(periodDays: number): Promise<ProductRanking[]> {
    const endDate = formatDate(new Date());
    const startDate = formatDate(getDateDaysAgo(periodDays));

    // 기간 내 모든 일별 조회수 데이터 조회
    const dailyViews = await this.productRepository.findAllDailyViewsByPeriod(startDate, endDate);

    // 상품별 총 조회수 집계
    const productViewCounts = new Map<string, number>();
    for (const dailyView of dailyViews) {
      const productId = dailyView.getProductId();
      const currentCount = productViewCounts.get(productId) || 0;
      productViewCounts.set(productId, currentCount + dailyView.getViewCount());
    }

    // 조회수 기준으로 정렬하여 랭킹 부여
    const sortedProducts = Array.from(productViewCounts.entries()).sort((a, b) => b[1] - a[1]);

    const rankings: ProductRanking[] = [];
    for (let i = 0; i < sortedProducts.length; i++) {
      const [productId, totalViews] = sortedProducts[i];
      const ranking = new ProductRanking(productId, totalViews, i + 1, periodDays);
      rankings.push(ranking);

      // 랭킹 데이터 저장
      await this.productRepository.saveRanking(ranking);
    }

    return rankings;
  }

  /**
   * 인기 상품 랭킹을 조회합니다.
   *
   * @param periodDays 집계 기간 (일)
   * @param limit 조회할 상품 수
   * @returns 상위 랭킹 목록
   */
  async getTopRankings(periodDays: number, limit: number): Promise<ProductRanking[]> {
    return await this.productRepository.findTopRankings(periodDays, limit);
  }
}
