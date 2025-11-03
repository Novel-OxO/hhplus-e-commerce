import { Server } from 'http';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductOption } from '@/domain/product/product-option.entity';
import { Product } from '@/domain/product/product.entity';
import { PRODUCT_REPOSITORY, ProductRepository } from '@/domain/product/product.repository';
import { CartsModule } from '@/infrastructure/di/carts.module';
import { AddCartItemResponseDto } from '@/presentation/http/cart/dto/add-cart-item.dto';
import { ClearCartResponseDto } from '@/presentation/http/cart/dto/clear-cart.dto';
import { DeleteCartItemResponseDto } from '@/presentation/http/cart/dto/delete-cart-item.dto';
import { GetCartResponseDto } from '@/presentation/http/cart/dto/get-cart.dto';

describe('CartsController (Integration)', () => {
  let app: INestApplication<Server>;
  let productRepository: ProductRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CartsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    productRepository = moduleFixture.get<ProductRepository>(PRODUCT_REPOSITORY);

    // 테스트용 상품 데이터 준비
    await setupTestProducts();
  });

  afterEach(async () => {
    await app.close();
  });

  const setupTestProducts = async () => {
    // 정상 상품 옵션
    const product1 = new Product('product-1', '베이직 티셔츠', 'T-Shirt', 29000, new Date(), new Date());

    const option1 = new ProductOption('option-1', 'product-1', 'Red-M', 0, 100, new Date(), new Date());

    const option2 = new ProductOption('option-2', 'product-1', 'Blue-M', 1000, 50, new Date(), new Date());

    // 재고가 적은 상품 옵션
    const option3 = new ProductOption('option-3', 'product-1', 'Green-M', 0, 3, new Date(), new Date());

    // 재고가 없는 상품 옵션
    const option4 = new ProductOption('option-4', 'product-1', 'Black-M', 0, 0, new Date(), new Date());
    await productRepository.saveProduct(product1);
    await productRepository.saveOption(option1);
    await productRepository.saveOption(option2);
    await productRepository.saveOption(option3);
    await productRepository.saveOption(option4);
  };

  describe('POST /carts/items', () => {
    it('장바구니에 상품을 추가한다', async () => {
      const userId = 'user123';
      const productOptionId = 'option-1';
      const quantity = 2;

      const response = await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId, productOptionId, quantity })
        .expect(201);

      const data = response.body as AddCartItemResponseDto;
      expect(data).toHaveProperty('cartItemId');
      expect(data).toHaveProperty('productOptionId', productOptionId);
      expect(data).toHaveProperty('quantity', quantity);
      expect(data).toHaveProperty('savedPrice', 0);
      expect(data).toHaveProperty('currentStock', 100);
      expect(data).toHaveProperty('createdAt');
    });

    it('같은 상품을 추가하면 수량이 증가한다', async () => {
      const userId = 'user456';
      const productOptionId = 'option-1';

      // 첫 번째 추가
      const firstResponse = await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId, productOptionId, quantity: 2 })
        .expect(201);

      const firstData = firstResponse.body as AddCartItemResponseDto;
      expect(firstData.quantity).toBe(2);

      // 같은 상품 다시 추가
      const secondResponse = await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId, productOptionId, quantity: 3 })
        .expect(201);

      const secondData = secondResponse.body as AddCartItemResponseDto;
      expect(secondData.cartItemId).toBe(firstData.cartItemId);
      expect(secondData.quantity).toBe(5);
    });

    it('수량이 0 이하이면 실패한다', async () => {
      const userId = 'user789';
      const productOptionId = 'option-1';
      const quantity = 0;

      const response = await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId, productOptionId, quantity })
        .expect(400);

      expect(response.body).toHaveProperty('message', '수량은 1 이상이어야 합니다.');
    });

    it('존재하지 않는 상품 옵션이면 실패한다', async () => {
      const userId = 'user999';
      const productOptionId = 'nonexistent';
      const quantity = 1;

      const response = await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId, productOptionId, quantity })
        .expect(404);

      expect(response.body).toHaveProperty('message', '상품 옵션을 찾을 수 없습니다.');
    });
  });

  describe('GET /carts', () => {
    it('장바구니 목록을 조회한다', async () => {
      // given: 장바구니에 상품 2개 추가
      const userId = 'user-cart-list';

      await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId, productOptionId: 'option-1', quantity: 2 })
        .expect(201);

      await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId, productOptionId: 'option-2', quantity: 1 })
        .expect(201);

      // when: 장바구니 조회
      const response = await request(app.getHttpServer()).get('/carts').query({ userId }).expect(200);

      // then
      const data = response.body as GetCartResponseDto;
      expect(data.items).toHaveLength(2);
      expect(data.totalItems).toBe(2);
      expect(data.totalAmount).toBe(1000); // option-1: 0 * 2, option-2: 1000 * 1

      // 각 아이템 확인
      data.items.forEach((item) => {
        expect(item).toHaveProperty('cartItemId');
        expect(item).toHaveProperty('productOptionId');
        expect(item).toHaveProperty('quantity');
        expect(item).toHaveProperty('savedPrice');
        expect(item).toHaveProperty('currentPrice');
        expect(item).toHaveProperty('currentStock');
        expect(item).toHaveProperty('isPriceChanged');
        expect(item).toHaveProperty('isStockSufficient');
        expect(item).toHaveProperty('subtotal');
      });
    });

    it('장바구니가 비어있으면 빈 배열을 반환한다', async () => {
      const userId = 'user-empty-cart';

      const response = await request(app.getHttpServer()).get('/carts').query({ userId }).expect(200);

      const data = response.body as GetCartResponseDto;
      expect(data.items).toEqual([]);
      expect(data.totalAmount).toBe(0);
      expect(data.totalItems).toBe(0);
    });

    it('재고가 부족한 상품을 표시한다', async () => {
      const userId = 'user-stock-check';

      // 재고가 3개인 상품에 5개 추가
      await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId, productOptionId: 'option-3', quantity: 5 })
        .expect(201);

      const response = await request(app.getHttpServer()).get('/carts').query({ userId }).expect(200);

      const data = response.body as GetCartResponseDto;
      expect(data.items).toHaveLength(1);
      expect(data.items[0].isStockSufficient).toBe(false);
      expect(data.items[0].currentStock).toBe(3);
      expect(data.items[0].quantity).toBe(5);
    });
  });

  describe('DELETE /carts/items/:itemId', () => {
    it('장바구니 아이템을 삭제한다', async () => {
      // given: 장바구니에 상품 추가
      const userId = 'user-delete-item';
      const addResponse = await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId, productOptionId: 'option-1', quantity: 1 })
        .expect(201);

      const cartItemId = (addResponse.body as AddCartItemResponseDto).cartItemId;

      // when: 아이템 삭제
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/carts/items/${cartItemId}`)
        .query({ userId })
        .expect(200);

      const data = deleteResponse.body as DeleteCartItemResponseDto;
      expect(data).toHaveProperty('message', '장바구니 항목이 삭제되었습니다');

      // then: 장바구니 조회 시 비어있음
      const cartResponse = await request(app.getHttpServer()).get('/carts').query({ userId }).expect(200);

      expect((cartResponse.body as GetCartResponseDto).items).toEqual([]);
    });

    it('존재하지 않는 아이템 삭제 시 실패한다', async () => {
      const userId = 'user-delete-nonexistent';
      const nonExistentItemId = 'nonexistent-item';

      const response = await request(app.getHttpServer())
        .delete(`/carts/items/${nonExistentItemId}`)
        .query({ userId })
        .expect(404);

      expect(response.body).toHaveProperty('message', '장바구니 아이템을 찾을 수 없습니다.');
    });

    it('다른 사용자의 아이템 삭제 시 실패한다', async () => {
      // given: user1이 장바구니에 상품 추가
      const user1 = 'user1';
      const user2 = 'user2';

      const addResponse = await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId: user1, productOptionId: 'option-1', quantity: 1 })
        .expect(201);

      const cartItemId = (addResponse.body as AddCartItemResponseDto).cartItemId;

      // when: user2가 user1의 아이템 삭제 시도
      const response = await request(app.getHttpServer())
        .delete(`/carts/items/${cartItemId}`)
        .query({ userId: user2 })
        .expect(403);

      expect(response.body).toHaveProperty('message', '장바구니 아이템에 대한 권한이 없습니다.');
    });
  });

  describe('DELETE /carts', () => {
    it('장바구니를 전체 삭제한다', async () => {
      // given: 장바구니에 상품 여러 개 추가
      const userId = 'user-clear-cart';

      await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId, productOptionId: 'option-1', quantity: 2 })
        .expect(201);

      await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId, productOptionId: 'option-2', quantity: 1 })
        .expect(201);

      // when: 장바구니 전체 삭제
      const clearResponse = await request(app.getHttpServer()).delete('/carts').query({ userId }).expect(200);

      const data = clearResponse.body as ClearCartResponseDto;
      expect(data).toHaveProperty('message', '장바구니가 비워졌습니다');

      // then: 장바구니 조회 시 비어있음
      const cartResponse = await request(app.getHttpServer()).get('/carts').query({ userId }).expect(200);

      expect((cartResponse.body as GetCartResponseDto).items).toEqual([]);
      expect((cartResponse.body as GetCartResponseDto).totalItems).toBe(0);
    });

    it('빈 장바구니를 삭제해도 성공한다', async () => {
      const userId = 'user-clear-empty-cart';

      const response = await request(app.getHttpServer()).delete('/carts').query({ userId }).expect(200);

      const data = response.body as ClearCartResponseDto;
      expect(data).toHaveProperty('message', '장바구니가 비워졌습니다');
    });
  });

  describe('통합 시나리오', () => {
    it('장바구니 추가, 조회, 삭제의 전체 플로우가 정상 작동한다', async () => {
      const userId = 'user-full-flow';

      // 1. 장바구니에 상품 추가
      const addResponse1 = await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId, productOptionId: 'option-1', quantity: 2 })
        .expect(201);

      expect((addResponse1.body as AddCartItemResponseDto).quantity).toBe(2);

      // 2. 같은 상품 추가 (수량 증가)
      const addResponse2 = await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId, productOptionId: 'option-1', quantity: 3 })
        .expect(201);

      expect((addResponse2.body as AddCartItemResponseDto).quantity).toBe(5);

      // 3. 다른 상품 추가
      await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId, productOptionId: 'option-2', quantity: 1 })
        .expect(201);

      // 4. 장바구니 조회
      const cartResponse = await request(app.getHttpServer()).get('/carts').query({ userId }).expect(200);

      const cartData = cartResponse.body as GetCartResponseDto;
      expect(cartData.items).toHaveLength(2);
      expect(cartData.totalItems).toBe(2);

      // 5. 하나의 아이템 삭제
      const firstItemId = cartData.items[0].cartItemId;
      await request(app.getHttpServer()).delete(`/carts/items/${firstItemId}`).query({ userId }).expect(200);

      // 6. 장바구니 조회 (1개 남음)
      const cartResponse2 = await request(app.getHttpServer()).get('/carts').query({ userId }).expect(200);

      expect((cartResponse2.body as GetCartResponseDto).items).toHaveLength(1);

      // 7. 장바구니 전체 삭제
      await request(app.getHttpServer()).delete('/carts').query({ userId }).expect(200);

      // 8. 장바구니 조회 (비어있음)
      const cartResponse3 = await request(app.getHttpServer()).get('/carts').query({ userId }).expect(200);

      expect((cartResponse3.body as GetCartResponseDto).items).toEqual([]);
    });

    it('여러 사용자가 독립적으로 장바구니를 사용할 수 있다', async () => {
      const user1 = 'user-multi-1';
      const user2 = 'user-multi-2';

      // user1이 상품 추가
      await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId: user1, productOptionId: 'option-1', quantity: 2 })
        .expect(201);

      // user2가 상품 추가
      await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId: user2, productOptionId: 'option-2', quantity: 3 })
        .expect(201);

      // user1 장바구니 조회
      const cart1Response = await request(app.getHttpServer()).get('/carts').query({ userId: user1 }).expect(200);

      const cart1 = cart1Response.body as GetCartResponseDto;
      expect(cart1.items).toHaveLength(1);
      expect(cart1.items[0].productOptionId).toBe('option-1');
      expect(cart1.items[0].quantity).toBe(2);

      // user2 장바구니 조회
      const cart2Response = await request(app.getHttpServer()).get('/carts').query({ userId: user2 }).expect(200);

      const cart2 = cart2Response.body as GetCartResponseDto;
      expect(cart2.items).toHaveLength(1);
      expect(cart2.items[0].productOptionId).toBe('option-2');
      expect(cart2.items[0].quantity).toBe(3);
    });
  });
});
