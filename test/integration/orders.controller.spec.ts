import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { CartsModule } from '@/infrastructure/di/carts.module';
import { CouponsModule } from '@/infrastructure/di/coupons.module';
import { OrdersModule } from '@/infrastructure/di/orders.module';
import { ProductsModule } from '@/infrastructure/di/products.module';
import { CreateOrderResponseDto } from '@/presentation/http/order/dto/create-order.dto';
import { GetOrderResponseDto } from '@/presentation/http/order/dto/get-order.dto';
import { TestAppBuilder } from '@test/common/test-app.builder';
import { TestContainerManager } from '@test/common/test-container.manager';

describe('OrdersController (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    await TestContainerManager.start();
    prisma = TestContainerManager.getPrisma();
    app = await new TestAppBuilder()
      .addModule(ProductsModule)
      .addModule(CouponsModule)
      .addModule(CartsModule)
      .addModule(OrdersModule)
      .build();
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000);

  beforeEach(async () => {
    await TestContainerManager.cleanupDatabase();
  });

  describe('POST /orders', () => {
    it('주문을 성공적으로 생성한다', async () => {
      // Given: 사용자, 상품, 포인트 잔액 생성
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

      // 포인트 잔액 생성
      await prisma.pointBalance.create({
        data: {
          userId: BigInt(Number(user.userId)),
          balance: 100000,
        },
      });

      const userId = Number(user.userId);
      const productOptionId = Number(productOption.productOptionId);
      const quantity = 2;

      // When: API 호출
      const response = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: userId.toString(),
          items: [
            {
              productOptionId: productOptionId.toString(),
              quantity,
            },
          ],
        })
        .expect(201);

      // Then: 응답 검증
      const body: CreateOrderResponseDto = response.body;
      expect(body.orderId).toBeDefined();
      expect(body.status).toBe('PENDING');
      expect(body.items).toHaveLength(1);
      expect(body.items[0].productOptionId).toBe(productOptionId.toString());
      expect(body.items[0].quantity).toBe(quantity);
      expect(body.items[0].unitPrice).toBe(29000);
      expect(body.items[0].subtotal).toBe(29000 * quantity);
      expect(body.orderAmount).toBe(29000 * quantity);
      expect(body.discountAmount).toBe(0);
      expect(body.finalAmount).toBe(29000 * quantity);
      expect(body.createdAt).toBeDefined();

      // 데이터베이스 검증
      const order = await prisma.order.findFirst({
        where: {
          userId: BigInt(userId),
        },
        include: {
          orderItems: true,
        },
      });

      expect(order).toBeDefined();
      expect(order?.userId).toBe(BigInt(userId));
      expect(order?.orderStatus).toBe('PENDING');
      expect(order?.orderItems).toHaveLength(1);
      expect(Number(order?.orderItems[0].productOptionId)).toBe(productOptionId);
      expect(order?.orderItems[0].quantity).toBe(quantity);

      // 재고 감소 확인
      const updatedOption = await prisma.productOption.findUnique({
        where: { productOptionId: BigInt(productOptionId) },
      });
      expect(updatedOption?.stockQuantity).toBe(100 - quantity);
    });

    it('쿠폰을 사용하여 주문을 생성한다', async () => {
      // Given: 사용자, 상품, 쿠폰, 포인트 잔액 생성
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
          basePrice: 50000,
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

      const now = new Date();
      const validFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const validUntil = new Date(now.getTime() + 30 * 60 * 60 * 1000);

      const coupon = await prisma.coupon.create({
        data: {
          couponName: '10% 할인 쿠폰',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          maxDiscountAmount: 5000,
          minOrderAmount: 10000,
          totalQuantity: 100,
          issuedQuantity: 0,
          validFrom,
          validUntil,
        },
      });

      // 쿠폰 발급
      const issueResponse = await request(app.getHttpServer())
        .post(`/coupons/${Number(coupon.couponId)}/issue`)
        .send({ userId: Number(user.userId).toString() })
        .expect(201);

      const userCouponId = issueResponse.body.userCouponId;

      // 포인트 잔액 생성
      await prisma.pointBalance.create({
        data: {
          userId: BigInt(Number(user.userId)),
          balance: 100000,
        },
      });

      const userId = Number(user.userId);
      const productOptionId = Number(productOption.productOptionId);
      const quantity = 1;

      // When: 쿠폰을 사용하여 주문 생성
      const response = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: userId.toString(),
          items: [
            {
              productOptionId: productOptionId.toString(),
              quantity,
            },
          ],
          userCouponId: userCouponId.toString(),
        })
        .expect(201);

      // Then: 응답 검증
      const body: CreateOrderResponseDto = response.body;
      expect(body.orderId).toBeDefined();
      expect(body.orderAmount).toBe(50000);
      expect(body.discountAmount).toBe(5000); // 10% 할인, 최대 5000원
      expect(body.finalAmount).toBe(45000);
      expect(body.createdAt).toBeDefined();

      // 데이터베이스 검증
      const order = await prisma.order.findFirst({
        where: {
          userId: BigInt(userId),
        },
      });

      expect(order).toBeDefined();
      expect(order?.userCouponId).toBe(BigInt(userCouponId));
      expect(order?.discountPrice.toNumber()).toBe(5000);
      expect(order?.finalPrice.toNumber()).toBe(45000);
    });

    it('여러 상품을 주문한다', async () => {
      // Given: 사용자, 여러 상품, 포인트 잔액 생성
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

      // 포인트 잔액 생성
      await prisma.pointBalance.create({
        data: {
          userId: BigInt(Number(user.userId)),
          balance: 100000,
        },
      });

      const userId = Number(user.userId);

      // When: 여러 상품을 주문
      const response = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: userId.toString(),
          items: [
            {
              productOptionId: Number(productOption1.productOptionId).toString(),
              quantity: 2,
            },
            {
              productOptionId: Number(productOption2.productOptionId).toString(),
              quantity: 1,
            },
          ],
        })
        .expect(201);

      // Then: 응답 검증
      const body: CreateOrderResponseDto = response.body;
      expect(body.items).toHaveLength(2);
      expect(body.orderAmount).toBe(29000 * 2 + 39000 * 1);
      expect(body.finalAmount).toBe(29000 * 2 + 39000 * 1);

      // 데이터베이스 검증
      const order = await prisma.order.findFirst({
        where: {
          userId: BigInt(userId),
        },
        include: {
          orderItems: true,
        },
      });

      expect(order?.orderItems).toHaveLength(2);
    });

    it('존재하지 않는 상품 옵션으로 주문하면 404 에러를 반환한다', async () => {
      // Given: 사용자, 포인트 잔액 생성
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      // 포인트 잔액 생성
      await prisma.pointBalance.create({
        data: {
          userId: BigInt(Number(user.userId)),
          balance: 100000,
        },
      });

      const userId = Number(user.userId);
      const nonExistentProductOptionId = '99999';

      // When & Then: API 호출 및 에러 검증
      await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: userId.toString(),
          items: [
            {
              productOptionId: nonExistentProductOptionId,
              quantity: 1,
            },
          ],
        })
        .expect(404);
    });

    it('재고가 부족한 경우 주문에 실패한다', async () => {
      // Given: 사용자, 재고가 부족한 상품, 포인트 잔액 생성
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

      // 포인트 잔액 생성
      await prisma.pointBalance.create({
        data: {
          userId: BigInt(Number(user.userId)),
          balance: 100000,
        },
      });

      const userId = Number(user.userId);
      const productOptionId = Number(productOption.productOptionId);

      // When & Then: 재고보다 많은 수량 주문 시도
      await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: userId.toString(),
          items: [
            {
              productOptionId: productOptionId.toString(),
              quantity: 10, // 재고보다 많은 수량
            },
          ],
        })
        .expect(400);
    });
  });

  describe('GET /orders/:orderId', () => {
    it('주문을 성공적으로 조회한다', async () => {
      // Given: 사용자, 상품, 주문 생성
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

      // 포인트 잔액 생성
      await prisma.pointBalance.create({
        data: {
          userId: BigInt(Number(user.userId)),
          balance: 100000,
        },
      });

      const userId = Number(user.userId);

      // 주문 생성
      const createResponse = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: userId.toString(),
          items: [
            {
              productOptionId: Number(productOption.productOptionId).toString(),
              quantity: 2,
            },
          ],
        })
        .expect(201);

      const orderId = createResponse.body.orderId;

      // When: 주문 조회
      const response = await request(app.getHttpServer()).get(`/orders/${orderId}?userId=${userId}`).expect(200);

      // Then: 응답 검증
      const body: GetOrderResponseDto = response.body;
      expect(body.orderId).toBe(orderId);
      expect(body.userId).toBe(userId.toString());
      expect(body.status).toBe('PENDING');
      expect(body.items).toHaveLength(1);
      expect(body.items[0].productOptionId).toBe(Number(productOption.productOptionId).toString());
      expect(body.items[0].quantity).toBe(2);
      expect(body.items[0].unitPrice).toBe(29000);
      expect(body.items[0].subtotal).toBe(29000 * 2);
      expect(body.orderAmount).toBe(29000 * 2);
      expect(body.discountAmount).toBe(0);
      expect(body.finalAmount).toBe(29000 * 2);
      expect(body.userCouponId).toBeNull();
      expect(body.createdAt).toBeDefined();
      expect(body.completedAt).toBeNull();
      expect(body.cancelledAt).toBeNull();
    });

    it('다른 사용자의 주문을 조회하면 404 에러를 반환한다', async () => {
      // Given: 두 사용자, 상품, 주문 생성
      const user1 = await prisma.user.create({
        data: {
          name: '테스트 사용자 1',
          email: 'test1@example.com',
        },
      });

      const user2 = await prisma.user.create({
        data: {
          name: '테스트 사용자 2',
          email: 'test2@example.com',
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

      // 포인트 잔액 생성
      await prisma.pointBalance.create({
        data: {
          userId: BigInt(Number(user1.userId)),
          balance: 100000,
        },
      });

      // user1의 주문 생성
      const createResponse = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: Number(user1.userId).toString(),
          items: [
            {
              productOptionId: Number(productOption.productOptionId).toString(),
              quantity: 2,
            },
          ],
        })
        .expect(201);

      const orderId = createResponse.body.orderId;

      // When & Then: user2가 user1의 주문 조회 시도
      await request(app.getHttpServer())
        .get(`/orders/${orderId}?userId=${Number(user2.userId)}`)
        .expect(404);
    });

    it('존재하지 않는 주문 ID로 조회하면 404 에러를 반환한다', async () => {
      // Given: 사용자 생성
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const userId = Number(user.userId);
      const nonExistentOrderId = '99999';

      // When & Then: API 호출 및 에러 검증
      await request(app.getHttpServer()).get(`/orders/${nonExistentOrderId}?userId=${userId}`).expect(404);
    });
  });
});
