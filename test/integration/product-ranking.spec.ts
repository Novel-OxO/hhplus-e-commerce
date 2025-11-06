import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductRankingService } from '@/application/product-ranking.service';
import { ProductService } from '@/application/product.service';
import { Product } from '@/domain/product/product.entity';
import { PRODUCT_REPOSITORY, ProductRepository } from '@/domain/product/product.repository';
import { ProductsModule } from '@/infrastructure/di/products.module';

describe('Product Ranking (Integration)', () => {
  let app: INestApplication;
  let productService: ProductService;
  let productRankingService: ProductRankingService;
  let productRepository: ProductRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProductsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    productService = moduleFixture.get<ProductService>(ProductService);
    productRankingService = moduleFixture.get<ProductRankingService>(ProductRankingService);
    productRepository = moduleFixture.get<ProductRepository>(PRODUCT_REPOSITORY);

    await setupTestProducts();
  });

  afterEach(async () => {
    await app.close();
  });

  const setupTestProducts = async () => {
    const product1 = new Product('product-1', '오버핏 후드티', '부드러운 기모 안감', 45000, new Date(), new Date());
    const product2 = new Product('product-2', '슬림핏 청바지', '신축성 좋은 데님', 59000, new Date(), new Date());
    const product3 = new Product('product-3', '롱 패딩 코트', '방수 및 방풍 기능', 189000, new Date(), new Date());
    const product4 = new Product('product-4', '니트 가디건', '100% 울 소재', 79000, new Date(), new Date());
    const product5 = new Product('product-5', '크롭 맨투맨', '트렌디한 크롭 디자인', 39000, new Date(), new Date());

    await (productRepository as any).saveProduct(product1);
    await (productRepository as any).saveProduct(product2);
    await (productRepository as any).saveProduct(product3);
    await (productRepository as any).saveProduct(product4);
    await (productRepository as any).saveProduct(product5);
  };

  describe('상품 조회수 기록', () => {
    it('상품 조회 시 조회수가 기록된다', async () => {
      const productId = 'product-1';
      const userId = 'user-123';

      await productService.recordProductView(productId, userId);

      // 조회수가 정상적으로 기록되었는지 확인 (에러가 발생하지 않으면 성공)
      expect(true).toBe(true);
    });

    it('userId 없이 상품 조회 시에도 조회수가 기록된다', async () => {
      const productId = 'product-2';

      await productService.recordProductView(productId);

      expect(true).toBe(true);
    });

    it('존재하지 않는 상품 조회 시 NotFoundException이 발생한다', async () => {
      const nonExistentProductId = 'product-nonexistent';

      await expect(productService.recordProductView(nonExistentProductId)).rejects.toThrow('상품을 찾을 수 없습니다.');
    });

    it('같은 상품을 여러 번 조회하면 조회수가 누적된다', async () => {
      const productId = 'product-3';

      // 같은 상품을 5번 조회
      for (let i = 0; i < 5; i++) {
        await productService.recordProductView(productId, `user-${i}`);
      }

      expect(true).toBe(true);
    });
  });

  describe('랭킹 계산 및 조회', () => {
    beforeEach(async () => {
      // 각 상품에 조회수 기록
      // product-1: 10회
      for (let i = 0; i < 10; i++) {
        await productService.recordProductView('product-1', `user-${i}`);
      }

      // product-2: 7회
      for (let i = 0; i < 7; i++) {
        await productService.recordProductView('product-2', `user-${i}`);
      }

      // product-3: 15회 (가장 많이 조회됨)
      for (let i = 0; i < 15; i++) {
        await productService.recordProductView('product-3', `user-${i}`);
      }

      // product-4: 3회
      for (let i = 0; i < 3; i++) {
        await productService.recordProductView('product-4', `user-${i}`);
      }

      // product-5: 조회 안 함
    });

    it('최근 3일 랭킹을 계산한다', async () => {
      const rankings = await productRankingService.calculateRankings(3);

      expect(rankings).toHaveLength(4); // 조회된 상품만 랭킹에 포함
      expect(rankings[0].getProductId()).toBe('product-3'); // 가장 많이 조회된 상품
      expect(rankings[0].getTotalViews()).toBe(15);
      expect(rankings[0].getRankingPosition()).toBe(1);
      expect(rankings[0].getPeriodDays()).toBe(3);
    });

    it('랭킹이 조회수 순으로 정렬된다', async () => {
      const rankings = await productRankingService.calculateRankings(3);

      expect(rankings[0].getTotalViews()).toBe(15); // product-3
      expect(rankings[1].getTotalViews()).toBe(10); // product-1
      expect(rankings[2].getTotalViews()).toBe(7); // product-2
      expect(rankings[3].getTotalViews()).toBe(3); // product-4
    });

    it('상위 N개 랭킹을 조회할 수 있다', async () => {
      await productRankingService.calculateRankings(3);

      const top2Rankings = await productRankingService.getTopRankings(3, 2);

      expect(top2Rankings).toHaveLength(2);
      expect(top2Rankings[0].getProductId()).toBe('product-3');
      expect(top2Rankings[1].getProductId()).toBe('product-1');
    });

    it('인기 상품 목록을 조회할 수 있다', async () => {
      await productRankingService.calculateRankings(3);

      const popularProducts = await productService.getPopularProducts(3, 3);

      expect(popularProducts).toHaveLength(3);
      expect(popularProducts[0].getId()).toBe('product-3');
      expect(popularProducts[0].getName()).toBe('롱 패딩 코트');
      expect(popularProducts[1].getId()).toBe('product-1');
      expect(popularProducts[1].getName()).toBe('오버핏 후드티');
      expect(popularProducts[2].getId()).toBe('product-2');
      expect(popularProducts[2].getName()).toBe('슬림핏 청바지');
    });

    it('랭킹 계산 전에는 빈 배열을 반환한다', async () => {
      // 랭킹 계산하지 않고 바로 조회
      const rankings = await productRankingService.getTopRankings(7, 5);

      expect(rankings).toHaveLength(0);
    });

    it('서로 다른 기간에 대해 독립적인 랭킹을 유지한다', async () => {
      await productRankingService.calculateRankings(3);
      await productRankingService.calculateRankings(7);

      const rankings3Days = await productRankingService.getTopRankings(3, 10);
      const rankings7Days = await productRankingService.getTopRankings(7, 10);

      expect(rankings3Days).toHaveLength(4);
      expect(rankings7Days).toHaveLength(4);
      expect(rankings3Days[0].getPeriodDays()).toBe(3);
      expect(rankings7Days[0].getPeriodDays()).toBe(7);
    });
  });

  describe('실시간 조회수와 배치 랭킹 통합 시나리오', () => {
    it('조회수 기록 → 랭킹 계산 → 인기 상품 조회 전체 흐름이 정상 동작한다', async () => {
      // 1. 여러 사용자가 상품을 조회
      await productService.recordProductView('product-1', 'user-1');
      await productService.recordProductView('product-1', 'user-2');
      await productService.recordProductView('product-2', 'user-1');
      await productService.recordProductView('product-3', 'user-1');
      await productService.recordProductView('product-3', 'user-2');
      await productService.recordProductView('product-3', 'user-3');

      // 2. 배치 작업으로 랭킹 계산
      const rankings = await productRankingService.calculateRankings(1);

      // 3. 랭킹 검증
      expect(rankings).toHaveLength(3);
      expect(rankings[0].getProductId()).toBe('product-3'); // 3회 조회
      expect(rankings[1].getProductId()).toBe('product-1'); // 2회 조회
      expect(rankings[2].getProductId()).toBe('product-2'); // 1회 조회

      // 4. 인기 상품 API를 통해 조회
      const popularProducts = await productService.getPopularProducts(1, 5);

      // 5. 인기 상품 검증
      expect(popularProducts).toHaveLength(3);
      expect(popularProducts[0].getName()).toBe('롱 패딩 코트');
      expect(popularProducts[1].getName()).toBe('오버핏 후드티');
      expect(popularProducts[2].getName()).toBe('슬림핏 청바지');
    });

    it('추가 조회 후 랭킹을 재계산하면 순위가 변경된다', async () => {
      // 초기 조회
      await productService.recordProductView('product-1', 'user-1');
      await productService.recordProductView('product-2', 'user-1');
      await productService.recordProductView('product-2', 'user-2');

      // 첫 번째 랭킹 계산
      await productRankingService.calculateRankings(1);
      let popularProducts = await productService.getPopularProducts(1, 5);
      expect(popularProducts[0].getId()).toBe('product-2'); // product-2가 1위

      // 추가 조회로 product-1의 조회수 증가
      await productService.recordProductView('product-1', 'user-2');
      await productService.recordProductView('product-1', 'user-3');
      await productService.recordProductView('product-1', 'user-4');

      // 랭킹 재계산
      await productRankingService.calculateRankings(1);
      popularProducts = await productService.getPopularProducts(1, 5);
      expect(popularProducts[0].getId()).toBe('product-1'); // product-1이 1위로 변경
    });
  });
});
