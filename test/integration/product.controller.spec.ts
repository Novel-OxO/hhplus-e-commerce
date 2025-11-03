import { Server } from 'http';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductOption } from '@/domain/product/product-option.entity';
import { Product } from '@/domain/product/product.entity';
import { PRODUCT_REPOSITORY, ProductRepository } from '@/domain/product/product.repository';
import { ProductsModule } from '@/infrastructure/di/products.module';
import { GetPopularProductsResponseDto } from '@/presentation/http/product/dto/popular-products-response.dto';
import { GetProductDetailResponseDto } from '@/presentation/http/product/dto/product-response.dto';
import { GetProductStockResponseDto } from '@/presentation/http/product/dto/product-stock-response.dto';

describe('ProductsController (Integration)', () => {
  let app: INestApplication<Server>;
  let productRepository: ProductRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProductsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    productRepository = moduleFixture.get<ProductRepository>(PRODUCT_REPOSITORY);

    await setupTestProducts();
  });

  afterEach(async () => {
    await app.close();
  });

  const setupTestProducts = async () => {
    const product1 = new Product('product-1', 'Basic T-Shirt', 'Soft cotton material', 29000, new Date(), new Date());

    const product2 = new Product('product-2', 'Slim Fit Jeans', 'Stretch fabric', 59000, new Date(), new Date());

    const product3 = new Product('product-3', 'Oversized Hoodie', 'Warm fleece lining', 45000, new Date(), new Date());

    const option1 = new ProductOption('option-1', 'product-1', 'Red - M', 0, 150, new Date(), new Date());

    const option2 = new ProductOption('option-2', 'product-1', 'Blue - L', 0, 80, new Date(), new Date());

    const option3 = new ProductOption('option-3', 'product-1', 'Red - L', 0, 0, new Date(), new Date());

    const option4 = new ProductOption('option-4', 'product-2', 'Black - 28', 0, 50, new Date(), new Date());

    await (productRepository as any).saveProduct(product1);
    await (productRepository as any).saveProduct(product2);
    await (productRepository as any).saveProduct(product3);

    await productRepository.saveOption(option1);
    await productRepository.saveOption(option2);
    await productRepository.saveOption(option3);
    await productRepository.saveOption(option4);
  };

  describe('GET /products/popular', () => {
    it('인기 상품 목록을 조회한다', async () => {
      const days = 3;
      const limit = 5;

      const response = await request(app.getHttpServer()).get('/products/popular').query({ days, limit }).expect(200);

      const data = response.body as GetPopularProductsResponseDto;
      expect(data).toHaveProperty('products');
      expect(data).toHaveProperty('period');
      expect(data.period.days).toBe(days);
      expect(Array.isArray(data.products)).toBe(true);
    });

    it('days 파라미터가 없으면 기본값 3을 사용한다', async () => {
      const response = await request(app.getHttpServer()).get('/products/popular').query({ limit: 5 }).expect(200);

      const data = response.body as GetPopularProductsResponseDto;
      expect(data.period.days).toBe(3);
    });

    it('limit 파라미터가 없으면 기본값 5를 사용한다', async () => {
      const response = await request(app.getHttpServer()).get('/products/popular').query({ days: 7 }).expect(200);

      const data = response.body as GetPopularProductsResponseDto;
      expect(data.products.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /products/:id', () => {
    it('상품 ID로 상품 상세 정보와 옵션을 조회한다', async () => {
      const productId = 'product-1';

      const response = await request(app.getHttpServer()).get(`/products/${productId}`).expect(200);

      const data = response.body as GetProductDetailResponseDto;
      expect(data).toHaveProperty('product');
      expect(data.product.id).toBe(productId);
      expect(data.product.name).toBe('Basic T-Shirt');
      expect(data.product.description).toBe('Soft cotton material');
      expect(data.product.price).toBe(29000);
      expect(data.product.options).toHaveLength(3);

      const firstOption = data.product.options[0];
      expect(firstOption).toHaveProperty('id');
      expect(firstOption).toHaveProperty('productId', productId);
      expect(firstOption).toHaveProperty('name');
      expect(firstOption).toHaveProperty('additionalPrice');
      expect(firstOption).toHaveProperty('stock');
    });

    it('존재하지 않는 상품 ID로 조회하면 404 에러를 반환한다', async () => {
      const nonExistentProductId = 'product-nonexistent';

      const response = await request(app.getHttpServer()).get(`/products/${nonExistentProductId}`).expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /products/:id/options/:optionId/stock', () => {
    it('특정 상품의 특정 옵션 재고를 조회한다', async () => {
      const productId = 'product-1';
      const optionId = 'option-1';

      const response = await request(app.getHttpServer())
        .get(`/products/${productId}/options/${optionId}/stock`)
        .expect(200);

      const data = response.body as GetProductStockResponseDto;
      expect(data.optionId).toBe(optionId);
      expect(data.productId).toBe(productId);
      expect(data.name).toBe('Red - M');
      expect(data.stock).toBe(150);
      expect(data.isAvailable).toBe(true);
    });

    it('재고가 0인 옵션은 isAvailable이 false다', async () => {
      const productId = 'product-1';
      const optionId = 'option-3';

      const response = await request(app.getHttpServer())
        .get(`/products/${productId}/options/${optionId}/stock`)
        .expect(200);

      const data = response.body as GetProductStockResponseDto;
      expect(data.stock).toBe(0);
      expect(data.isAvailable).toBe(false);
    });

    it('존재하지 않는 상품 ID로 조회하면 404 에러를 반환한다', async () => {
      const nonExistentProductId = 'product-nonexistent';
      const optionId = 'option-1';

      await request(app.getHttpServer()).get(`/products/${nonExistentProductId}/options/${optionId}/stock`).expect(404);
    });

    it('존재하지 않는 옵션 ID로 조회하면 404 에러를 반환한다', async () => {
      const productId = 'product-1';
      const nonExistentOptionId = 'option-nonexistent';

      await request(app.getHttpServer()).get(`/products/${productId}/options/${nonExistentOptionId}/stock`).expect(404);
    });

    it('다른 상품의 옵션으로 조회하면 404 에러를 반환한다', async () => {
      const productId = 'product-1';
      const differentProductOptionId = 'option-4';

      await request(app.getHttpServer())
        .get(`/products/${productId}/options/${differentProductOptionId}/stock`)
        .expect(404);
    });
  });
});
