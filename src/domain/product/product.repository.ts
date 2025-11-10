import { ProductDailyView } from './product-daily-view.entity';
import { ProductOption } from './product-option.entity';
import { ProductRanking } from './product-ranking.entity';
import { ProductViewLog } from './product-view-log.entity';
import { Product } from './product.entity';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepository {
  findById(productId: number): Promise<Product | null>;

  findOptionsByProductId(productId: number): Promise<ProductOption[]>;

  findOptionById(optionId: string): Promise<ProductOption | null>;

  findPopularByPeriod(days: number, limit: number): Promise<Product[]>;

  saveProduct(product: Product): Promise<Product>;

  saveOption(option: ProductOption): Promise<ProductOption>;

  findOptionByIdWithLock(optionId: string): Promise<ProductOption | null>;

  // 조회수 관련 메서드
  saveViewLog(viewLog: ProductViewLog): Promise<ProductViewLog>;

  findOrCreateDailyView(productId: string, viewDate: string): Promise<ProductDailyView>;

  saveDailyView(dailyView: ProductDailyView): Promise<ProductDailyView>;

  findDailyViewsByPeriod(productId: string, startDate: string, endDate: string): Promise<ProductDailyView[]>;

  findAllDailyViewsByPeriod(startDate: string, endDate: string): Promise<ProductDailyView[]>;

  saveRanking(ranking: ProductRanking): Promise<ProductRanking>;

  findTopRankings(periodDays: number, limit: number): Promise<ProductRanking[]>;
}
