import { ProductRankingAggregator } from '@/domain/product/product-ranking.aggregator';
import { ProductViewCount } from '@/domain/product/product-view-count.vo';
import { Product } from '@/domain/product/product.entity';

describe('ProductRankingAggregator', () => {
  let aggregator: ProductRankingAggregator;
  let targetDate: Date;

  beforeEach(() => {
    aggregator = new ProductRankingAggregator();
    targetDate = new Date('2024-01-15T00:00:00Z');
  });

  describe('aggregate', () => {
    it('조회수 데이터와 상품 정보를 받아서 순위가 할당된 ProductRanking 리스트를 생성한다', () => {
      // given
      const viewCounts = [
        ProductViewCount.create(1, 100),
        ProductViewCount.create(2, 200),
        ProductViewCount.create(3, 50),
      ];

      const products = [
        new Product(1, '상품1', '설명1', 10000, new Date(), new Date()),
        new Product(2, '상품2', '설명2', 20000, new Date(), new Date()),
        new Product(3, '상품3', '설명3', 30000, new Date(), new Date()),
      ];

      // when
      const rankings = aggregator.aggregate(viewCounts, products, targetDate);

      // then
      expect(rankings).toHaveLength(3);
      expect(rankings[0].getProductId()).toBe(2); // 조회수 200
      expect(rankings[0].getRankingPosition()).toBe(1);
      expect(rankings[0].getTotalViews()).toBe(200);

      expect(rankings[1].getProductId()).toBe(1); // 조회수 100
      expect(rankings[1].getRankingPosition()).toBe(2);
      expect(rankings[1].getTotalViews()).toBe(100);

      expect(rankings[2].getProductId()).toBe(3); // 조회수 50
      expect(rankings[2].getRankingPosition()).toBe(3);
      expect(rankings[2].getTotalViews()).toBe(50);
    });

    it('조회수가 같은 경우에도 순위를 정상적으로 할당한다', () => {
      // given
      const viewCounts = [
        ProductViewCount.create(1, 100),
        ProductViewCount.create(2, 100),
        ProductViewCount.create(3, 100),
      ];

      const products = [
        new Product(1, '상품1', '설명1', 10000, new Date(), new Date()),
        new Product(2, '상품2', '설명2', 20000, new Date(), new Date()),
        new Product(3, '상품3', '설명3', 30000, new Date(), new Date()),
      ];

      // when
      const rankings = aggregator.aggregate(viewCounts, products, targetDate);

      // then
      expect(rankings).toHaveLength(3);
      expect(rankings[0].getRankingPosition()).toBe(1);
      expect(rankings[1].getRankingPosition()).toBe(2);
      expect(rankings[2].getRankingPosition()).toBe(3);
    });

    it('빈 조회수 배열로 호출하면 빈 배열을 반환한다', () => {
      // given
      const viewCounts: ProductViewCount[] = [];
      const products = [new Product(1, '상품1', '설명1', 10000, new Date(), new Date())];

      // when
      const rankings = aggregator.aggregate(viewCounts, products, targetDate);

      // then
      expect(rankings).toHaveLength(0);
    });

    it('빈 상품 배열로 호출하면 빈 배열을 반환한다', () => {
      // given
      const viewCounts = [ProductViewCount.create(1, 100)];
      const products: Product[] = [];

      // when
      const rankings = aggregator.aggregate(viewCounts, products, targetDate);

      // then
      expect(rankings).toHaveLength(0);
    });
  });
});
