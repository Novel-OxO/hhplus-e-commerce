import { Inject, Injectable } from '@nestjs/common';
import { NotFoundException } from '@/common/exceptions';
import { ProductOption } from '@/domain/product/product-option.entity';
import { ProductViewLog } from '@/domain/product/product-view-log.entity';
import { ProductWithOptions } from '@/domain/product/product-with-options.vo';
import { Product } from '@/domain/product/product.entity';
import { PRODUCT_REPOSITORY, type ProductRepository } from '@/domain/product/product.repository';
import { ID_GENERATOR, type IdGenerator } from '@/infrastructure/id-generator/id-generator.interface';
import { ProductRankingService } from './product-ranking.service';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IdGenerator,
    private readonly productRankingService: ProductRankingService,
  ) {}

  async getProductWithOptions(productId: string): Promise<ProductWithOptions> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    const options = await this.productRepository.findOptionsByProductId(productId);

    return new ProductWithOptions(product, options);
  }

  async getOptionStock(productId: string, optionId: string): Promise<ProductOption> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    const option = await this.productRepository.findOptionById(optionId);

    if (!option) {
      throw new NotFoundException('상품 옵션을 찾을 수 없습니다.');
    }

    if (option.getProductId() !== productId) {
      throw new NotFoundException('해당 상품의 옵션이 아닙니다.');
    }

    return option;
  }

  /**
   * 인기 상품 목록을 조회합니다.
   * ProductRanking 데이터를 기반으로 상위 상품을 반환합니다.
   *
   * @param days 집계 기간 (일)
   * @param limit 조회할 상품 수
   * @returns 인기 상품 목록
   */
  async getPopularProducts(days: number, limit: number): Promise<Product[]> {
    // 랭킹 데이터 조회
    const rankings = await this.productRankingService.getTopRankings(days, limit);

    // 상품 정보 조회
    const products: Product[] = [];
    for (const ranking of rankings) {
      const product = await this.productRepository.findById(ranking.getProductId());
      if (product) {
        products.push(product);
      }
    }

    return products;
  }

  /**
   * 상품 조회수를 기록합니다.
   * - ProductViewLog: 개별 조회 이벤트 로그 저장
   * - ProductDailyView: 일별 조회수 집계 (실시간 증가)
   */
  async recordProductView(productId: string, userId?: string): Promise<void> {
    // 상품 존재 여부 확인
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    const now = new Date();
    const viewDate = this.formatDate(now);

    // 1. 조회 로그 저장 (상세 추적용)
    const logId = this.idGenerator.generate();
    const viewLog = new ProductViewLog(logId, productId, userId, now);
    await this.productRepository.saveViewLog(viewLog);

    // 2. 일별 집계 데이터 증가 (실시간 통계용)
    const dailyView = await this.productRepository.findOrCreateDailyView(productId, viewDate);
    dailyView.incrementViewCount();
    await this.productRepository.saveDailyView(dailyView);
  }

  /**
   * 날짜를 YYYY-MM-DD 형식으로 포맷팅합니다.
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
