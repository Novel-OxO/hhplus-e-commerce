import { PrismaClient, Product } from '@prisma/client';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ProductRankingService } from '@/application/product/product-ranking.service';
import { ProductsModule } from '@/infrastructure/di/products.module';
import { GetPopularProductsResponseDto } from '@/presentation/http/product/dto/popular-products-response.dto';
import { GetProductDetailResponseDto } from '@/presentation/http/product/dto/product-response.dto';
import { GetProductStockResponseDto } from '@/presentation/http/product/dto/product-stock-response.dto';
import { TestAppBuilder } from '@test/common/test-app.builder';
import { TestContainerManager } from '@test/common/test-container.manager';

describe('ProductsController (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let productRankingService: ProductRankingService;

  beforeAll(async () => {
    await TestContainerManager.start();
    prisma = TestContainerManager.getPrisma();
    app = await new TestAppBuilder().addModule(ProductsModule).build();
    productRankingService = app.get(ProductRankingService);
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000);

  beforeEach(async () => {
    await TestContainerManager.cleanupDatabase();
  });

  describe('GET /products/:id', () => {
    it('상품 상세 정보를 성공적으로 조회한다', async () => {
      // Given: 상품 및 옵션 데이터 생성
      const product = await prisma.product.create({
        data: {
          productName: '테스트 상품',
          description: '테스트 상품 설명',
          basePrice: 29000,
        },
      });

      const option1 = await prisma.productOption.create({
        data: {
          productId: product.productId,
          optionName: '빨강 - M',
          sku: 'TEST-RED-M',
          stockQuantity: 100,
        },
      });

      const option2 = await prisma.productOption.create({
        data: {
          productId: product.productId,
          optionName: '파랑 - L',
          sku: 'TEST-BLUE-L',
          stockQuantity: 50,
        },
      });

      // When: API 호출
      const response = await request(app.getHttpServer()).get(`/products/${product.productId}`).expect(200);

      // Then: 응답 검증
      const body: GetProductDetailResponseDto = response.body;
      expect(body.product).toBeDefined();
      expect(body.product.id).toBe(Number(product.productId));
      expect(body.product.name).toBe('테스트 상품');
      expect(body.product.description).toBe('테스트 상품 설명');
      expect(body.product.price).toBe(29000);
      expect(body.product.options).toHaveLength(2);

      // 옵션 검증
      const optionIds = body.product.options.map((opt) => opt.id);
      expect(optionIds).toContain(Number(option1.productOptionId));
      expect(optionIds).toContain(Number(option2.productOptionId));

      const redOption = body.product.options.find((opt) => opt.id === Number(option1.productOptionId));
      expect(redOption).toBeDefined();
      expect(redOption?.name).toBe('빨강 - M');
      expect(redOption?.sku).toBe('TEST-RED-M');
      expect(redOption?.stock).toBe(100);
      expect(redOption?.productId).toBe(Number(product.productId));

      const blueOption = body.product.options.find((opt) => opt.id === Number(option2.productOptionId));
      expect(blueOption).toBeDefined();
      expect(blueOption?.name).toBe('파랑 - L');
      expect(blueOption?.sku).toBe('TEST-BLUE-L');
      expect(blueOption?.stock).toBe(50);
      expect(blueOption?.productId).toBe(Number(product.productId));
    });

    it('옵션이 없는 상품도 조회할 수 있다', async () => {
      // Given: 옵션 없이 상품만 생성
      const product = await prisma.product.create({
        data: {
          productName: '옵션 없는 상품',
          description: '옵션이 없는 상품 설명',
          basePrice: 15000,
        },
      });

      // When: API 호출
      const response = await request(app.getHttpServer()).get(`/products/${product.productId}`).expect(200);

      // Then: 응답 검증
      const body: GetProductDetailResponseDto = response.body;
      expect(body.product).toBeDefined();
      expect(body.product.id).toBe(Number(product.productId));
      expect(body.product.name).toBe('옵션 없는 상품');
      expect(body.product.options).toHaveLength(0);
    });

    it('존재하지 않는 상품 ID로 조회하면 404 에러를 반환한다', async () => {
      // Given: 존재하지 않는 상품 ID
      const nonExistentProductId = 99999;

      // When & Then: API 호출 및 에러 검증
      const response = await request(app.getHttpServer()).get(`/products/${nonExistentProductId}`).expect(404);

      expect(response.body.message).toContain('상품을 찾을 수 없습니다');
    });
  });

  describe('GET /products/:id/options/:optionId/stock', () => {
    it('옵션 재고 정보를 성공적으로 조회한다', async () => {
      // Given: 상품 및 옵션 데이터 생성
      const product = await prisma.product.create({
        data: {
          productName: '테스트 상품',
          description: '테스트 상품 설명',
          basePrice: 29000,
        },
      });

      const option = await prisma.productOption.create({
        data: {
          productId: product.productId,
          optionName: '빨강 - M',
          sku: 'TEST-RED-M',
          stockQuantity: 100,
        },
      });

      // When: API 호출
      const response = await request(app.getHttpServer())
        .get(`/products/${product.productId}/options/${option.productOptionId}/stock`)
        .expect(200);

      // Then: 응답 검증
      const body: GetProductStockResponseDto = response.body;
      expect(body.optionId).toBe(String(option.productOptionId));
      expect(body.productId).toBe(Number(product.productId));
      expect(body.name).toBe('빨강 - M');
      expect(body.stock).toBe(100);
      expect(body.isAvailable).toBe(true);
    });

    it('재고가 0인 경우 isAvailable이 false로 반환된다', async () => {
      // Given: 재고가 0인 옵션 생성
      const product = await prisma.product.create({
        data: {
          productName: '재고 없는 상품',
          description: '재고가 없는 상품 설명',
          basePrice: 15000,
        },
      });

      const option = await prisma.productOption.create({
        data: {
          productId: product.productId,
          optionName: '품절 옵션',
          sku: 'OUT-OF-STOCK',
          stockQuantity: 0,
        },
      });

      // When: API 호출
      const response = await request(app.getHttpServer())
        .get(`/products/${product.productId}/options/${option.productOptionId}/stock`)
        .expect(200);

      // Then: 응답 검증
      const body: GetProductStockResponseDto = response.body;
      expect(body.stock).toBe(0);
      expect(body.isAvailable).toBe(false);
    });

    it('존재하지 않는 상품 ID로 조회하면 404 에러를 반환한다', async () => {
      // Given: 존재하지 않는 상품 ID와 옵션 ID
      const nonExistentProductId = 99999;
      const optionId = 1;

      // When & Then: API 호출 및 에러 검증
      const response = await request(app.getHttpServer())
        .get(`/products/${nonExistentProductId}/options/${optionId}/stock`)
        .expect(404);

      expect(response.body.message).toContain('상품 옵션을 찾을 수 없습니다');
    });

    it('존재하지 않는 옵션 ID로 조회하면 404 에러를 반환한다', async () => {
      // Given: 상품은 존재하지만 옵션은 존재하지 않는 경우
      const product = await prisma.product.create({
        data: {
          productName: '테스트 상품',
          description: '테스트 상품 설명',
          basePrice: 29000,
        },
      });

      const nonExistentOptionId = 99999;

      // When & Then: API 호출 및 에러 검증
      const response = await request(app.getHttpServer())
        .get(`/products/${product.productId}/options/${nonExistentOptionId}/stock`)
        .expect(404);

      expect(response.body.message).toContain('상품 옵션을 찾을 수 없습니다');
    });

    it('다른 상품에 속한 옵션 ID로 조회하면 404 에러를 반환한다', async () => {
      // Given: 두 개의 상품과 각각의 옵션 생성
      const product1 = await prisma.product.create({
        data: {
          productName: '상품 1',
          description: '상품 1 설명',
          basePrice: 10000,
        },
      });

      const product2 = await prisma.product.create({
        data: {
          productName: '상품 2',
          description: '상품 2 설명',
          basePrice: 20000,
        },
      });

      const option1 = await prisma.productOption.create({
        data: {
          productId: product1.productId,
          optionName: '상품 1 옵션',
          sku: 'PROD1-OPT1',
          stockQuantity: 50,
        },
      });

      // When & Then: 상품 2의 ID로 상품 1의 옵션을 조회하면 404 에러
      const response = await request(app.getHttpServer())
        .get(`/products/${product2.productId}/options/${option1.productOptionId}/stock`)
        .expect(404);

      expect(response.body.message).toContain('상품 옵션을 찾을 수 없습니다');
    });
  });

  describe('GET /products/popular', () => {
    it('인기 상품이 정상적으로 조회된다', async () => {
      // Given: 여러 상품 생성
      const product1 = await prisma.product.create({
        data: {
          productName: '인기 상품 1',
          description: '가장 인기 있는 상품',
          basePrice: 10000,
        },
      });

      const product2 = await prisma.product.create({
        data: {
          productName: '인기 상품 2',
          description: '두 번째 인기 상품',
          basePrice: 20000,
        },
      });

      const product3 = await prisma.product.create({
        data: {
          productName: '인기 상품 3',
          description: '세 번째 인기 상품',
          basePrice: 30000,
        },
      });

      // 조회수 기록을 위한 날짜 설정 (같은 날짜로)
      const targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0);

      // 조회수 기록 (product1: 100회, product2: 50회, product3: 200회)
      for (let i = 0; i < 100; i++) {
        await productRankingService.recordProductView(Number(product1.productId), undefined, targetDate);
      }
      for (let i = 0; i < 50; i++) {
        await productRankingService.recordProductView(Number(product2.productId), undefined, targetDate);
      }
      for (let i = 0; i < 200; i++) {
        await productRankingService.recordProductView(Number(product3.productId), undefined, targetDate);
      }

      // 랭킹 계산 및 저장
      await productRankingService.calculateRankings(targetDate);

      // When: API 호출
      const response = await request(app.getHttpServer()).get('/products/popular?limit=3').expect(200);

      // Then: 응답 검증
      const body: GetPopularProductsResponseDto = response.body;
      expect(body.products).toBeDefined();
      expect(body.products.length).toBeGreaterThan(0);
      expect(body.period.days).toBe(3);

      // 조회수 순서대로 정렬되어 있는지 확인 (product3 > product1 > product2)
      const productIds = body.products.map((p) => p.id);
      expect(productIds[0]).toBe(Number(product3.productId)); // 조회수 200
      expect(productIds[1]).toBe(Number(product1.productId)); // 조회수 100
      expect(productIds[2]).toBe(Number(product2.productId)); // 조회수 50

      // 첫 번째 상품 상세 검증
      const topProduct = body.products[0];
      expect(topProduct.id).toBe(Number(product3.productId));
      expect(topProduct.name).toBe('인기 상품 3');
      expect(topProduct.description).toBe('세 번째 인기 상품');
      expect(topProduct.price).toBe(30000);
    });

    it('limit 파라미터가 제대로 동작한다', async () => {
      // Given: 여러 상품 생성
      const products: Product[] = [];
      for (let i = 1; i <= 10; i++) {
        const product = await prisma.product.create({
          data: {
            productName: `상품 ${i}`,
            description: `상품 ${i} 설명`,
            basePrice: 10000 * i,
          },
        });
        products.push(product);
      }

      // 조회수 기록을 위한 날짜 설정
      const targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0);

      // 각 상품에 조회수 기록 (상품 번호가 높을수록 조회수 많게)
      for (let i = 0; i < products.length; i++) {
        const viewCount = (i + 1) * 10;
        for (let j = 0; j < viewCount; j++) {
          await productRankingService.recordProductView(Number(products[i].productId), undefined, targetDate);
        }
      }

      // 랭킹 계산 및 저장
      await productRankingService.calculateRankings(targetDate);

      // When: limit=5로 API 호출
      const response = await request(app.getHttpServer()).get('/products/popular?limit=5').expect(200);

      // Then: 5개만 반환되는지 확인
      const body: GetPopularProductsResponseDto = response.body;
      expect(body.products).toHaveLength(5);
      expect(body.period.days).toBe(3);
    });

    it('limit 파라미터가 없으면 기본값 5가 적용된다', async () => {
      // Given: 여러 상품 생성
      const products: Product[] = [];
      for (let i = 1; i <= 10; i++) {
        const product = await prisma.product.create({
          data: {
            productName: `상품 ${i}`,
            description: `상품 ${i} 설명`,
            basePrice: 10000 * i,
          },
        });
        products.push(product);
      }

      // 조회수 기록을 위한 날짜 설정
      const targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0);

      // 각 상품에 조회수 기록
      for (let i = 0; i < products.length; i++) {
        const viewCount = (i + 1) * 10;
        for (let j = 0; j < viewCount; j++) {
          await productRankingService.recordProductView(Number(products[i].productId), undefined, targetDate);
        }
      }

      // 랭킹 계산 및 저장
      await productRankingService.calculateRankings(targetDate);

      // When: limit 파라미터 없이 API 호출
      const response = await request(app.getHttpServer()).get('/products/popular').expect(200);

      // Then: 기본값 5개가 반환되는지 확인
      const body: GetPopularProductsResponseDto = response.body;
      expect(body.products.length).toBeLessThanOrEqual(5);
      expect(body.period.days).toBe(3);
    });

    it('인기 상품이 없으면 빈 배열을 반환한다', async () => {
      // Given: 랭킹 데이터가 없는 상태

      // When: API 호출
      const response = await request(app.getHttpServer()).get('/products/popular').expect(200);

      // Then: 빈 배열 반환
      const body: GetPopularProductsResponseDto = response.body;
      expect(body.products).toEqual([]);
      expect(body.period.days).toBe(3);
    });
  });
});
