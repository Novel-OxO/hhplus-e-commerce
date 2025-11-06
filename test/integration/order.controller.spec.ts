import { Server } from 'http';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserMutexService } from '@/application/user-mutex.service';
import { CouponQuantity } from '@/domain/coupon/coupon-quantity.vo';
import { Coupon } from '@/domain/coupon/coupon.entity';
import { COUPON_REPOSITORY, CouponRepository } from '@/domain/coupon/coupon.repository';
import { DiscountType } from '@/domain/coupon/discount-type.vo';
import { DiscountValue } from '@/domain/coupon/discount-value.vo';
import { UserCoupon } from '@/domain/coupon/user-coupon.entity';
import { ValidityPeriod } from '@/domain/coupon/validity-period.vo';
import { PointBalance } from '@/domain/point/point-balance.entity';
import { POINT_REPOSITORY, PointRepository } from '@/domain/point/point.repository';
import { Point } from '@/domain/point/point.vo';
import { ProductOption } from '@/domain/product/product-option.entity';
import { PRODUCT_REPOSITORY, ProductRepository } from '@/domain/product/product.repository';
import { ConcurrencyModule } from '@/infrastructure/di/concurrency.module';
import { OrdersModule } from '@/infrastructure/di/orders.module';
import { CreateOrderResponseDto } from '@/presentation/http/order/dto/create-order.dto';
import { GetOrderResponseDto } from '@/presentation/http/order/dto/get-order.dto';
import { UpdateOrderStatusResponseDto } from '@/presentation/http/order/dto/update-order-status.dto';

describe('OrdersController (Integration)', () => {
  let app: INestApplication<Server>;
  let productRepository: ProductRepository;
  let pointRepository: PointRepository;
  let couponRepository: CouponRepository;
  let userMutexService: UserMutexService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConcurrencyModule, OrdersModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    productRepository = moduleFixture.get<ProductRepository>(PRODUCT_REPOSITORY);
    pointRepository = moduleFixture.get<PointRepository>(POINT_REPOSITORY);
    couponRepository = moduleFixture.get<CouponRepository>(COUPON_REPOSITORY);
    userMutexService = moduleFixture.get<UserMutexService>(UserMutexService);

    await setupTestData();
  });

  afterEach(async () => {
    userMutexService.stopCleanup();
    await app.close();
  });

  const setupTestData = async () => {
    // 상품 옵션 준비
    const option1 = new ProductOption('option-1', 'product-1', 'Red-M', 5000, 100, new Date(), new Date());
    const option2 = new ProductOption('option-2', 'product-1', 'Blue-L', 6000, 50, new Date(), new Date());
    const option3 = new ProductOption('option-3', 'product-2', 'Black-XL', 10000, 5, new Date(), new Date());

    await productRepository.saveOption(option1);
    await productRepository.saveOption(option2);
    await productRepository.saveOption(option3);

    // 쿠폰 준비
    const coupon = new Coupon(
      'coupon-1',
      '10% 할인 쿠폰',
      new DiscountValue(DiscountType.PERCENTAGE, 10),
      null, // maxDiscountAmount
      new Point(5000), // minOrderAmount
      new CouponQuantity(100, 0),
      new ValidityPeriod(new Date('2025-01-01'), new Date('2025-12-31')),
      new Date('2025-01-01'),
    );

    await couponRepository.saveCoupon(coupon);
  };

  describe('POST /orders', () => {
    it('주문을 생성한다', async () => {
      // given
      const userId = 'user123';
      const pointBalance = new PointBalance(userId, new Point(100000));
      await pointRepository.saveBalance(pointBalance);

      const orderRequest = {
        userId,
        items: [
          { productOptionId: 'option-1', quantity: 2 },
          { productOptionId: 'option-2', quantity: 1 },
        ],
        expectedAmount: 16000,
      };

      // when
      const response = await request(app.getHttpServer()).post('/orders').send(orderRequest).expect(201);

      // then
      const data = response.body as CreateOrderResponseDto;
      expect(data).toHaveProperty('orderId');
      expect(data).toHaveProperty('status', 'PENDING');
      expect(data.items).toHaveLength(2);
      expect(data.orderAmount).toBe(16000);
      expect(data.discountAmount).toBe(0);
      expect(data.finalAmount).toBe(16000);
      expect(data.pointsUsed).toBe(16000);
      expect(data.coupon).toBeNull();
      expect(data.pointBalance.previousBalance).toBe(100000);
      expect(data.pointBalance.currentBalance).toBe(84000);
    });

    it('쿠폰을 적용하여 주문을 생성한다', async () => {
      // given
      const userId = 'user456';
      const pointBalance = new PointBalance(userId, new Point(100000));
      await pointRepository.saveBalance(pointBalance);

      const userCoupon = new UserCoupon(
        'userCoupon-1',
        userId,
        'coupon-1',
        new Date('2025-01-15'),
        new ValidityPeriod(new Date('2025-01-15'), new Date('2025-12-31')),
      );
      await couponRepository.saveUserCoupon(userCoupon);

      const orderRequest = {
        userId,
        items: [{ productOptionId: 'option-1', quantity: 2 }],
        expectedAmount: 9000,
        userCouponId: 'userCoupon-1',
      };

      // when
      const response = await request(app.getHttpServer()).post('/orders').send(orderRequest).expect(201);

      // then
      const data = response.body as CreateOrderResponseDto;
      expect(data.orderAmount).toBe(10000);
      expect(data.discountAmount).toBe(1000);
      expect(data.finalAmount).toBe(9000);
      expect(data.pointsUsed).toBe(9000);
      expect(data.coupon).not.toBeNull();
      expect(data.coupon?.name).toBe('10% 할인 쿠폰');
      expect(data.pointBalance.currentBalance).toBe(91000);
    });

    it('포인트 잔액이 부족하면 실패한다', async () => {
      // given
      const userId = 'user789';
      const pointBalance = new PointBalance(userId, new Point(5000));
      await pointRepository.saveBalance(pointBalance);

      const orderRequest = {
        userId,
        items: [{ productOptionId: 'option-1', quantity: 2 }],
        expectedAmount: 10000,
      };

      // when
      const response = await request(app.getHttpServer()).post('/orders').send(orderRequest).expect(400);

      // then
      expect(response.body).toHaveProperty('message', '포인트 잔액이 부족합니다.');
    });

    it('재고가 부족하면 실패한다', async () => {
      // given
      const userId = 'user999';
      const pointBalance = new PointBalance(userId, new Point(100000));
      await pointRepository.saveBalance(pointBalance);

      const orderRequest = {
        userId,
        items: [{ productOptionId: 'option-3', quantity: 10 }],
        expectedAmount: 100000,
      };

      // when
      const response = await request(app.getHttpServer()).post('/orders').send(orderRequest).expect(400);

      // then
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('재고가 부족합니다');
    });

    it('예상 금액과 실제 금액이 다르면 실패한다', async () => {
      // given
      const userId = 'user888';
      const pointBalance = new PointBalance(userId, new Point(100000));
      await pointRepository.saveBalance(pointBalance);

      const orderRequest = {
        userId,
        items: [{ productOptionId: 'option-1', quantity: 2 }],
        expectedAmount: 8000, // 실제는 10000
      };

      // when
      const response = await request(app.getHttpServer()).post('/orders').send(orderRequest).expect(400);

      // then
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('금액이 일치하지 않습니다');
    });

    it('주문 항목이 없으면 실패한다', async () => {
      // given
      const userId = 'user777';
      const orderRequest = {
        userId,
        items: [],
        expectedAmount: 0,
      };

      // when
      const response = await request(app.getHttpServer()).post('/orders').send(orderRequest).expect(400);

      // then
      expect(response.body).toHaveProperty('message', '주문 항목이 없습니다.');
    });
  });

  describe('GET /orders/:orderId', () => {
    it('주문을 조회한다', async () => {
      // given
      const userId = 'user-order-get';
      const pointBalance = new PointBalance(userId, new Point(100000));
      await pointRepository.saveBalance(pointBalance);

      const createResponse = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId,
          items: [{ productOptionId: 'option-1', quantity: 2 }],
          expectedAmount: 10000,
        })
        .expect(201);

      const orderId = (createResponse.body as CreateOrderResponseDto).orderId;

      // when
      const response = await request(app.getHttpServer()).get(`/orders/${orderId}`).send({ userId }).expect(200);

      // then
      const data = response.body as GetOrderResponseDto;
      expect(data.orderId).toBe(orderId);
      expect(data.userId).toBe(userId);
      expect(data.status).toBe('PENDING');
      expect(data.items).toHaveLength(1);
      expect(data.orderAmount).toBe(10000);
      expect(data.finalAmount).toBe(10000);
    });

    it('존재하지 않는 주문을 조회하면 실패한다', async () => {
      // given
      const userId = 'user123';
      const nonExistentOrderId = 'nonexistent-order';

      // when
      const response = await request(app.getHttpServer())
        .get(`/orders/${nonExistentOrderId}`)
        .send({ userId })
        .expect(404);

      // then
      expect(response.body).toHaveProperty('message', '주문을 찾을 수 없습니다.');
    });

    it('다른 사용자의 주문을 조회하면 실패한다', async () => {
      // given
      const userId1 = 'user-order-1';
      const userId2 = 'user-order-2';

      const pointBalance = new PointBalance(userId1, new Point(100000));
      await pointRepository.saveBalance(pointBalance);

      const createResponse = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: userId1,
          items: [{ productOptionId: 'option-1', quantity: 1 }],
          expectedAmount: 5000,
        })
        .expect(201);

      const orderId = (createResponse.body as CreateOrderResponseDto).orderId;

      // when
      const response = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .send({ userId: userId2 })
        .expect(400);

      // then
      expect(response.body).toHaveProperty('message', '본인의 주문만 조회할 수 있습니다.');
    });
  });

  describe('PATCH /orders/:orderId/status', () => {
    it('주문을 완료 상태로 변경한다', async () => {
      // given
      const userId = 'user-complete';
      const pointBalance = new PointBalance(userId, new Point(100000));
      await pointRepository.saveBalance(pointBalance);

      const createResponse = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId,
          items: [{ productOptionId: 'option-1', quantity: 1 }],
          expectedAmount: 5000,
        })
        .expect(201);

      const orderId = (createResponse.body as CreateOrderResponseDto).orderId;

      // when
      const response = await request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .send({ userId, status: 'COMPLETED' })
        .expect(200);

      // then
      const data = response.body as UpdateOrderStatusResponseDto;
      expect(data.orderId).toBe(orderId);
      expect(data.status).toBe('COMPLETED');
      expect(data.message).toBe('주문 상태가 변경되었습니다.');
    });

    it('주문을 취소 상태로 변경한다', async () => {
      // given
      const userId = 'user-cancel';
      const pointBalance = new PointBalance(userId, new Point(100000));
      await pointRepository.saveBalance(pointBalance);

      const createResponse = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId,
          items: [{ productOptionId: 'option-1', quantity: 1 }],
          expectedAmount: 5000,
        })
        .expect(201);

      const orderId = (createResponse.body as CreateOrderResponseDto).orderId;

      // when
      const response = await request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .send({ userId, status: 'CANCELLED' })
        .expect(200);

      // then
      const data = response.body as UpdateOrderStatusResponseDto;
      expect(data.orderId).toBe(orderId);
      expect(data.status).toBe('CANCELLED');

      // 포인트가 환불되었는지 확인
      const refundedBalance = await pointRepository.findBalanceByUserId(userId);
      expect(refundedBalance?.getBalance().getValue()).toBe(100000);
    });

    it('존재하지 않는 주문의 상태를 변경하면 실패한다', async () => {
      // given
      const userId = 'user123';
      const nonExistentOrderId = 'nonexistent-order';

      // when
      const response = await request(app.getHttpServer())
        .patch(`/orders/${nonExistentOrderId}/status`)
        .send({ userId, status: 'COMPLETED' })
        .expect(404);

      // then
      expect(response.body).toHaveProperty('message', '주문을 찾을 수 없습니다.');
    });

    it('다른 사용자의 주문 상태를 변경하면 실패한다', async () => {
      // given
      const userId1 = 'user-status-1';
      const userId2 = 'user-status-2';

      const pointBalance = new PointBalance(userId1, new Point(100000));
      await pointRepository.saveBalance(pointBalance);

      const createResponse = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: userId1,
          items: [{ productOptionId: 'option-1', quantity: 1 }],
          expectedAmount: 5000,
        })
        .expect(201);

      const orderId = (createResponse.body as CreateOrderResponseDto).orderId;

      // when
      const response = await request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .send({ userId: userId2, status: 'COMPLETED' })
        .expect(400);

      // then
      expect(response.body).toHaveProperty('message', '본인의 주문만 수정할 수 있습니다.');
    });
  });

  describe('주문 생성 시나리오', () => {
    it('쿠폰 적용 주문 후 취소하면 쿠폰이 복구된다', async () => {
      // given
      const userId = 'user-coupon-restore';
      const pointBalance = new PointBalance(userId, new Point(100000));
      await pointRepository.saveBalance(pointBalance);

      const userCoupon = new UserCoupon(
        'userCoupon-restore',
        userId,
        'coupon-1',
        new Date('2025-01-15'),
        new ValidityPeriod(new Date('2025-01-15'), new Date('2025-12-31')),
      );
      await couponRepository.saveUserCoupon(userCoupon);

      // 주문 생성
      const createResponse = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId,
          items: [{ productOptionId: 'option-1', quantity: 2 }],
          expectedAmount: 9000,
          userCouponId: 'userCoupon-restore',
        })
        .expect(201);

      const orderId = (createResponse.body as CreateOrderResponseDto).orderId;

      // 주문 취소
      await request(app.getHttpServer())
        .patch(`/orders/${orderId}/status`)
        .send({ userId, status: 'CANCELLED' })
        .expect(200);

      // then: 쿠폰이 복구되었는지 확인
      const restoredCoupon = await couponRepository.findUserCouponById('userCoupon-restore');
      expect(restoredCoupon?.isUsed()).toBe(false);
    });
  });
});
