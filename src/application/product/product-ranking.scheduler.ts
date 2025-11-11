import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProductRankingService } from './product-ranking.service';

@Injectable()
export class ProductRankingScheduler {
  private readonly logger = new Logger(ProductRankingScheduler.name);

  constructor(private readonly productRankingService: ProductRankingService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async calculateRankings() {
    this.logger.log('최근 하루치 인기 상품 랭킹 계산 시작');

    try {
      const rankings = await this.productRankingService.calculateRankings();
      this.logger.log(`최근 하루치 랭킹 계산 완료: ${rankings.length}개 상품`);
    } catch (error) {
      this.logger.error('최근 하루치 랭킹 계산 실패', error);
    }
  }
}
