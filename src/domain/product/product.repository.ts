import { ProductDetail } from './product-detail.vo';
import { ProductOption } from './product-option.entity';
import { ProductRanking } from './product-ranking.entity';
import { ProductViewCount } from './product-view-count.vo';
import { ProductViewLog } from './product-view-log.entity';
import { ProductWithOptions } from './product-with-options.vo';
import { Product } from './product.entity';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepository {
  findByIdOrElseThrow(productId: number): Promise<Product>;

  findWithOptionsByProductIdOrElseThrow(productId: number): Promise<ProductWithOptions>;

  findOptionByIdOrElseThrow(optionId: number): Promise<ProductOption>;

  findOptionByOptionIdAndProductIdOrElseThrow(optionId: number, productId: number): Promise<ProductOption>;

  findDetailsByOptionIds(optionIds: string[]): Promise<ProductDetail[]>;

  // 조회수 관련 메서드
  saveViewLog(viewLog: ProductViewLog): Promise<ProductViewLog>;

  saveRanking(ranking: ProductRanking): Promise<ProductRanking>;

  // 랭킹 계산용 메서드
  aggregateViewsForDate(targetDate: Date): Promise<Array<ProductViewCount>>;

  findRankingsByDate(targetDate: Date, limit: number): Promise<ProductRanking[]>;

  findProductsByIds(productIds: number[]): Promise<Product[]>;
}
