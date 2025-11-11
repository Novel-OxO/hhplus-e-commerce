import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { CartsModule } from '@/infrastructure/di/carts.module';
import { AddCartItemResponseDto } from '@/presentation/http/cart/dto/add-cart-item.dto';
import { ClearCartResponseDto } from '@/presentation/http/cart/dto/clear-cart.dto';
import { DeleteCartItemResponseDto } from '@/presentation/http/cart/dto/delete-cart-item.dto';
import { GetCartResponseDto } from '@/presentation/http/cart/dto/get-cart.dto';
import { TestAppBuilder } from '@test/common/test-app.builder';
import { TestContainerManager } from '@test/common/test-container.manager';

describe('CartsController (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    await TestContainerManager.start();
    prisma = TestContainerManager.getPrisma();
    app = await new TestAppBuilder().addModule(CartsModule).build();
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000);

  beforeEach(async () => {
    await TestContainerManager.cleanupDatabase();
  });

  describe('POST /carts/items', () => {
    it('장바구니에 새 아이템을 성공적으로 추가한다', async () => {
      // Given: 사용자 및 상품 옵션 생성
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const product = await prisma.product.create({
        data: {
          productName: '테스트 상품',
          description: '테스트 상품 설명',
          basePrice: 29000,
        },
      });

      const productOption = await prisma.productOption.create({
        data: {
          productId: product.productId,
          optionName: '빨강 - M',
          sku: 'TEST-RED-M',
          stockQuantity: 100,
        },
      });

      const userId = Number(user.userId);
      const productOptionId = Number(productOption.productOptionId);
      const quantity = 2;

      // When: API 호출
      const response = await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId, productOptionId, quantity })
        .expect(201);

      // Then: 응답 검증
      const body: AddCartItemResponseDto = response.body;
      expect(body.cartItemId).toBeDefined();
      expect(body.productOptionId).toBe(productOptionId);
      expect(body.quantity).toBe(quantity);
      expect(body.currentStock).toBe(100);
      expect(body.createdAt).toBeDefined();

      // 데이터베이스 검증
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          userId: BigInt(userId),
          productOptionId: BigInt(productOptionId),
        },
      });

      expect(cartItem).toBeDefined();
      expect(cartItem?.userId).toBe(BigInt(userId));
      expect(Number(cartItem?.productOptionId)).toBe(productOptionId);
      expect(cartItem?.quantity).toBe(quantity);
    });

    it('이미 장바구니에 있는 아이템의 수량을 증가시킨다', async () => {
      // Given: 사용자, 상품 옵션 및 기존 장바구니 아이템 생성
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const product = await prisma.product.create({
        data: {
          productName: '테스트 상품',
          description: '테스트 상품 설명',
          basePrice: 29000,
        },
      });

      const productOption = await prisma.productOption.create({
        data: {
          productId: product.productId,
          optionName: '빨강 - M',
          sku: 'TEST-RED-M',
          stockQuantity: 100,
        },
      });

      const userId = Number(user.userId);
      const productOptionId = Number(productOption.productOptionId);
      const initialQuantity = 2;
      const additionalQuantity = 3;

      // 기존 장바구니 아이템 생성
      await prisma.cartItem.create({
        data: {
          userId: BigInt(userId),
          productOptionId: BigInt(productOptionId),
          quantity: initialQuantity,
          price: 29000,
        },
      });

      // When: 같은 상품 옵션을 다시 추가
      const response = await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId, productOptionId, quantity: additionalQuantity })
        .expect(201);

      // Then: 응답 검증
      const body: AddCartItemResponseDto = response.body;
      expect(body.quantity).toBe(initialQuantity + additionalQuantity);

      // 데이터베이스 검증
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          userId: BigInt(userId),
          productOptionId: BigInt(productOptionId),
        },
      });

      expect(cartItem).toBeDefined();
      expect(cartItem?.quantity).toBe(initialQuantity + additionalQuantity);
    });

    it('존재하지 않는 상품 옵션 ID로 추가하면 404 에러를 반환한다', async () => {
      // Given: 사용자 생성
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const userId = Number(user.userId);
      const nonExistentProductOptionId = 99999;
      const quantity = 2;

      // When & Then: API 호출 및 에러 검증
      await request(app.getHttpServer())
        .post('/carts/items')
        .send({ userId, productOptionId: nonExistentProductOptionId, quantity })
        .expect(404);
    });
  });

  describe('GET /carts', () => {
    it('장바구니를 성공적으로 조회한다', async () => {
      // Given: 사용자, 상품 및 장바구니 아이템 생성
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const product1 = await prisma.product.create({
        data: {
          productName: '테스트 상품 1',
          description: '테스트 상품 설명 1',
          basePrice: 29000,
        },
      });

      const product2 = await prisma.product.create({
        data: {
          productName: '테스트 상품 2',
          description: '테스트 상품 설명 2',
          basePrice: 39000,
        },
      });

      const productOption1 = await prisma.productOption.create({
        data: {
          productId: product1.productId,
          optionName: '빨강 - M',
          sku: 'TEST-RED-M',
          stockQuantity: 100,
        },
      });

      const productOption2 = await prisma.productOption.create({
        data: {
          productId: product2.productId,
          optionName: '파랑 - L',
          sku: 'TEST-BLUE-L',
          stockQuantity: 50,
        },
      });

      const userId = Number(user.userId);

      await prisma.cartItem.create({
        data: {
          userId: BigInt(userId),
          productOptionId: BigInt(Number(productOption1.productOptionId)),
          quantity: 2,
          price: 29000,
        },
      });

      await prisma.cartItem.create({
        data: {
          userId: BigInt(userId),
          productOptionId: BigInt(Number(productOption2.productOptionId)),
          quantity: 1,
          price: 39000,
        },
      });

      // When: API 호출
      const response = await request(app.getHttpServer()).get(`/carts?userId=${userId}`).expect(200);

      // Then: 응답 검증
      const body: GetCartResponseDto = response.body;
      expect(body.items).toHaveLength(2);
      expect(body.totalItems).toBe(2);
      expect(body.totalAmount).toBe(29000 * 2 + 39000 * 1);

      const item1 = body.items.find((item) => item.productOptionId === Number(productOption1.productOptionId));
      expect(item1).toBeDefined();
      expect(item1?.quantity).toBe(2);
      expect(item1?.currentPrice).toBe(29000);
      expect(item1?.currentStock).toBe(100);
      expect(item1?.isStockSufficient).toBe(true);
      expect(item1?.subtotal).toBe(29000 * 2);

      const item2 = body.items.find((item) => item.productOptionId === Number(productOption2.productOptionId));
      expect(item2).toBeDefined();
      expect(item2?.quantity).toBe(1);
      expect(item2?.currentPrice).toBe(39000);
      expect(item2?.currentStock).toBe(50);
      expect(item2?.isStockSufficient).toBe(true);
      expect(item2?.subtotal).toBe(39000 * 1);
    });

    it('빈 장바구니를 조회하면 빈 배열을 반환한다', async () => {
      // Given: 사용자 생성 (장바구니 아이템 없음)
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const userId = Number(user.userId);

      // When: API 호출
      const response = await request(app.getHttpServer()).get(`/carts?userId=${userId}`).expect(200);

      // Then: 응답 검증
      const body: GetCartResponseDto = response.body;
      expect(body.items).toHaveLength(0);
      expect(body.totalItems).toBe(0);
      expect(body.totalAmount).toBe(0);
    });

    it('재고가 부족한 경우 isStockSufficient가 false로 반환된다', async () => {
      // Given: 사용자, 상품 및 장바구니 아이템 생성 (재고보다 많은 수량)
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const product = await prisma.product.create({
        data: {
          productName: '테스트 상품',
          description: '테스트 상품 설명',
          basePrice: 29000,
        },
      });

      const productOption = await prisma.productOption.create({
        data: {
          productId: product.productId,
          optionName: '빨강 - M',
          sku: 'TEST-RED-M',
          stockQuantity: 5, // 재고 5개
        },
      });

      const userId = Number(user.userId);

      await prisma.cartItem.create({
        data: {
          userId: BigInt(userId),
          productOptionId: BigInt(Number(productOption.productOptionId)),
          quantity: 10, // 재고보다 많은 수량
          price: 29000,
        },
      });

      // When: API 호출
      const response = await request(app.getHttpServer()).get(`/carts?userId=${userId}`).expect(200);

      // Then: 응답 검증
      const body: GetCartResponseDto = response.body;
      expect(body.items).toHaveLength(1);
      expect(body.items[0].isStockSufficient).toBe(false);
      expect(body.items[0].currentStock).toBe(5);
      expect(body.items[0].quantity).toBe(10);
    });
  });

  describe('DELETE /carts/items/:itemId', () => {
    it('장바구니 아이템을 성공적으로 삭제한다', async () => {
      // Given: 사용자, 상품 및 장바구니 아이템 생성
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const product = await prisma.product.create({
        data: {
          productName: '테스트 상품',
          description: '테스트 상품 설명',
          basePrice: 29000,
        },
      });

      const productOption = await prisma.productOption.create({
        data: {
          productId: product.productId,
          optionName: '빨강 - M',
          sku: 'TEST-RED-M',
          stockQuantity: 100,
        },
      });

      const userId = Number(user.userId);

      const cartItem = await prisma.cartItem.create({
        data: {
          userId: BigInt(userId),
          productOptionId: BigInt(Number(productOption.productOptionId)),
          quantity: 2,
          price: 29000,
        },
      });

      const cartItemId = Number(cartItem.cartItemId);

      // When: API 호출
      const response = await request(app.getHttpServer())
        .delete(`/carts/items/${cartItemId}?userId=${userId}`)
        .expect(200);

      // Then: 응답 검증
      const body: DeleteCartItemResponseDto = response.body;
      expect(body.message).toBe('장바구니 항목이 삭제되었습니다');

      // 데이터베이스 검증
      const deletedCartItem = await prisma.cartItem.findUnique({
        where: { cartItemId: BigInt(cartItemId) },
      });

      expect(deletedCartItem).toBeNull();
    });
  });

  describe('DELETE /carts', () => {
    it('장바구니를 성공적으로 비운다', async () => {
      // Given: 사용자, 상품 및 여러 장바구니 아이템 생성
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const product1 = await prisma.product.create({
        data: {
          productName: '테스트 상품 1',
          description: '테스트 상품 설명 1',
          basePrice: 29000,
        },
      });

      const product2 = await prisma.product.create({
        data: {
          productName: '테스트 상품 2',
          description: '테스트 상품 설명 2',
          basePrice: 39000,
        },
      });

      const productOption1 = await prisma.productOption.create({
        data: {
          productId: product1.productId,
          optionName: '빨강 - M',
          sku: 'TEST-RED-M',
          stockQuantity: 100,
        },
      });

      const productOption2 = await prisma.productOption.create({
        data: {
          productId: product2.productId,
          optionName: '파랑 - L',
          sku: 'TEST-BLUE-L',
          stockQuantity: 50,
        },
      });

      const userId = Number(user.userId);

      await prisma.cartItem.create({
        data: {
          userId: BigInt(userId),
          productOptionId: BigInt(Number(productOption1.productOptionId)),
          quantity: 2,
          price: 29000,
        },
      });

      await prisma.cartItem.create({
        data: {
          userId: BigInt(userId),
          productOptionId: BigInt(Number(productOption2.productOptionId)),
          quantity: 1,
          price: 39000,
        },
      });

      // When: API 호출
      const response = await request(app.getHttpServer()).delete(`/carts?userId=${userId}`).expect(200);

      // Then: 응답 검증
      const body: ClearCartResponseDto = response.body;
      expect(body.message).toBe('장바구니가 비워졌습니다');

      // 데이터베이스 검증
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: BigInt(userId) },
      });

      expect(cartItems).toHaveLength(0);
    });

    it('빈 장바구니를 비워도 성공한다', async () => {
      // Given: 사용자 생성 (장바구니 아이템 없음)
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const userId = Number(user.userId);

      // When: API 호출
      const response = await request(app.getHttpServer()).delete(`/carts?userId=${userId}`).expect(200);

      // Then: 응답 검증
      const body: ClearCartResponseDto = response.body;
      expect(body.message).toBe('장바구니가 비워졌습니다');
    });
  });
});
