import { ProductRanking } from './product-ranking.entity';
import { ProductViewCount } from './product-view-count.vo';
import { Product } from './product.entity';

export class ProductRankingAggregator {
  aggregate(viewCounts: ProductViewCount[], products: Product[], targetDate: Date): ProductRanking[] {
    const sortedViewCounts = [...viewCounts].sort((a, b) => a.compareByViewCount(b));
    const productMap = new Map(products.map((product) => [product.getProductId(), product]));

    const rankings: ProductRanking[] = [];
    let currentRank = 1;

    for (const viewCount of sortedViewCounts) {
      const product = productMap.get(viewCount.getProductId());

      if (!product) {
        continue;
      }

      const ranking = new ProductRanking(product, viewCount.getViewCount(), currentRank, targetDate);

      rankings.push(ranking);
      currentRank++;
    }

    return rankings;
  }
}
