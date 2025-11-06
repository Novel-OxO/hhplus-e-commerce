import { Injectable } from '@nestjs/common';
import { ProductDailyView } from '@/domain/product/product-daily-view.entity';
import { ProductOption } from '@/domain/product/product-option.entity';
import { ProductRanking } from '@/domain/product/product-ranking.entity';
import { ProductViewLog } from '@/domain/product/product-view-log.entity';
import { Product } from '@/domain/product/product.entity';
import { ProductRepository } from '@/domain/product/product.repository';

@Injectable()
export class ProductMemoryRepository implements ProductRepository {
  private products: Map<string, Product> = new Map();
  private options: Map<string, ProductOption> = new Map();
  private viewLogs: Map<string, ProductViewLog> = new Map();
  private dailyViews: Map<string, ProductDailyView> = new Map();
  private rankings: Map<string, ProductRanking> = new Map();

  clear(): void {
    this.products.clear();
    this.options.clear();
    this.viewLogs.clear();
    this.dailyViews.clear();
    this.rankings.clear();
  }

  findById(productId: string): Promise<Product | null> {
    return Promise.resolve(this.products.get(productId) || null);
  }

  findOptionsByProductId(productId: string): Promise<ProductOption[]> {
    return Promise.resolve(Array.from(this.options.values()).filter((option) => option.getProductId() === productId));
  }

  findOptionById(optionId: string): Promise<ProductOption | null> {
    return Promise.resolve(this.options.get(optionId) || null);
  }
  // TODO 인기 상품 구현 조회는 주문 관련 기능이 구현 된 후에 개발 예정
  findPopularByPeriod(days: number, limit: number): Promise<Product[]> {
    const products = Array.from(this.products.values());
    return Promise.resolve(products.slice(0, limit));
  }

  saveOption(option: ProductOption): Promise<ProductOption> {
    this.options.set(option.getId(), option);
    return Promise.resolve(option);
  }

  findOptionByIdWithLock(optionId: string): Promise<ProductOption | null> {
    return Promise.resolve(this.options.get(optionId) || null);
  }

  saveProduct(product: Product): Promise<Product> {
    this.products.set(product.getId(), product);
    return Promise.resolve(product);
  }

  // 조회수 관련 메서드 구현
  saveViewLog(viewLog: ProductViewLog): Promise<ProductViewLog> {
    this.viewLogs.set(viewLog.getLogId(), viewLog);
    return Promise.resolve(viewLog);
  }

  findOrCreateDailyView(productId: string, viewDate: string): Promise<ProductDailyView> {
    const key = ProductDailyView.createKey(productId, viewDate);
    let dailyView = this.dailyViews.get(key);

    if (!dailyView) {
      dailyView = new ProductDailyView(productId, viewDate);
      this.dailyViews.set(key, dailyView);
    }

    return Promise.resolve(dailyView);
  }

  saveDailyView(dailyView: ProductDailyView): Promise<ProductDailyView> {
    this.dailyViews.set(dailyView.getKey(), dailyView);
    return Promise.resolve(dailyView);
  }

  findDailyViewsByPeriod(productId: string, startDate: string, endDate: string): Promise<ProductDailyView[]> {
    const views = Array.from(this.dailyViews.values()).filter(
      (view) => view.getProductId() === productId && view.getViewDate() >= startDate && view.getViewDate() <= endDate,
    );
    return Promise.resolve(views);
  }

  findAllDailyViewsByPeriod(startDate: string, endDate: string): Promise<ProductDailyView[]> {
    const views = Array.from(this.dailyViews.values()).filter(
      (view) => view.getViewDate() >= startDate && view.getViewDate() <= endDate,
    );
    return Promise.resolve(views);
  }

  saveRanking(ranking: ProductRanking): Promise<ProductRanking> {
    const key = `${ranking.getPeriodDays()}:${ranking.getProductId()}`;
    this.rankings.set(key, ranking);
    return Promise.resolve(ranking);
  }

  findTopRankings(periodDays: number, limit: number): Promise<ProductRanking[]> {
    const rankings = Array.from(this.rankings.values())
      .filter((ranking) => ranking.getPeriodDays() === periodDays)
      .sort((a, b) => a.getRankingPosition() - b.getRankingPosition())
      .slice(0, limit);
    return Promise.resolve(rankings);
  }
}
