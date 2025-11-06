import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProductRankingService } from './product-ranking.service';

@Injectable()
export class ProductRankingScheduler {
  private readonly logger = new Logger(ProductRankingScheduler.name);

  constructor(private readonly productRankingService: ProductRankingService) {}

  /**
   * 매일 자정에 최근 3일 인기 상품 랭킹을 계산합니다.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async calculate3DayRankings() {
    this.logger.log('최근 3일 인기 상품 랭킹 계산 시작');

    try {
      const rankings = await this.productRankingService.calculateRankings(3);
      this.logger.log(`최근 3일 랭킹 계산 완료: ${rankings.length}개 상품`);
    } catch (error) {
      this.logger.error('최근 3일 랭킹 계산 실패', error);
    }
  }

  // 추후 아래 코드 처럼 다양한 기간에 대해 배치 가능

  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  // async calculate7DayRankings() {
  //   this.logger.log('최근 7일 인기 상품 랭킹 계산 시작');

  //   try {
  //     const rankings = await this.productRankingService.calculateRankings(7);
  //     this.logger.log(`최근 7일 랭킹 계산 완료: ${rankings.length}개 상품`);
  //   } catch (error) {
  //     this.logger.error('최근 7일 랭킹 계산 실패', error);
  //   }
  // }
}
