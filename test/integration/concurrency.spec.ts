import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CouponService } from '@/application/coupon.service';
import { OrderService } from '@/application/order.service';
import { PointService } from '@/application/point.service';
import { UserMutexService } from '@/application/user-mutex.service';
import { CouponQuantity } from '@/domain/coupon/coupon-quantity.vo';
import { Coupon } from '@/domain/coupon/coupon.entity';
import { COUPON_REPOSITORY, type CouponRepository } from '@/domain/coupon/coupon.repository';
import { DiscountType } from '@/domain/coupon/discount-type.vo';
import { DiscountValue } from '@/domain/coupon/discount-value.vo';
import { ValidityPeriod } from '@/domain/coupon/validity-period.vo';
import { PaymentStatus } from '@/domain/payment/payment-status.vo';
import { PG_CLIENT } from '@/domain/payment/pg-client.interface';
import { ChargeStatus } from '@/domain/point/charge-status.vo';
import { PointBalance } from '@/domain/point/point-balance.entity';
import { POINT_REPOSITORY, PointRepository } from '@/domain/point/point.repository';
import { Point } from '@/domain/point/point.vo';
import { ProductOption } from '@/domain/product/product-option.entity';
import { PRODUCT_REPOSITORY, ProductRepository } from '@/domain/product/product.repository';
import { ConcurrencyModule } from '@/infrastructure/di/concurrency.module';
import { OrdersModule } from '@/infrastructure/di/orders.module';
import { PointsModule } from '@/infrastructure/di/points.module';
import { MockPGClient } from '@/infrastructure/external/mock-pg-client';

/**
 * 동시성 제어 통합 테스트
 *
 * UserMutexService를 통한 애플리케이션 레벨 동시성 제어가
 * 올바르게 작동하는지 검증합니다.
 */
describe('Concurrency Control (Integration)', () => {
  let app: INestApplication;
  let orderService: OrderService;
  let pointService: PointService;
  let couponService: CouponService;
  let pointRepository: PointRepository;
  let productRepository: ProductRepository;
  let couponRepository: CouponRepository;
  let mockPGClient: MockPGClient;
  let userMutexService: UserMutexService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConcurrencyModule, OrdersModule, PointsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    orderService = moduleFixture.get<OrderService>(OrderService);
    pointService = moduleFixture.get<PointService>(PointService);
    couponService = moduleFixture.get<CouponService>(CouponService);
    pointRepository = moduleFixture.get<PointRepository>(POINT_REPOSITORY);
    productRepository = moduleFixture.get<ProductRepository>(PRODUCT_REPOSITORY);
    couponRepository = moduleFixture.get<CouponRepository>(COUPON_REPOSITORY);
    mockPGClient = moduleFixture.get<MockPGClient>(PG_CLIENT);
    userMutexService = moduleFixture.get<UserMutexService>(UserMutexService);
  });

  afterEach(async () => {
    // UserMutexService의 cleanup timer 정리
    userMutexService.stopCleanup();
    await app.close();
  });

  describe('포인트 충전 동시성 제어', () => {
    it('같은 사용자가 동시에 여러 번 포인트 충전을 시도하면 순차적으로 처리된다', async () => {
      // Given: 사용자의 초기 잔액 설정
      const userId = 'user-concurrent-charge';
      const initialBalance = new PointBalance(userId, new Point(10000), new Date());
      await pointRepository.saveBalance(initialBalance);

      // 충전 요청 생성
      const chargeAmount = new Point(5000);
      const chargeRequests = await Promise.all([
        pointService.createChargeRequest(userId, chargeAmount),
        pointService.createChargeRequest(userId, chargeAmount),
        pointService.createChargeRequest(userId, chargeAmount),
      ]);

      // PG 결제 정보 등록
      chargeRequests.forEach((req) => {
        mockPGClient.mockPayment(`payment-${req.getChargeRequestId()}`, chargeAmount.getValue(), PaymentStatus.SUCCESS);
      });

      // When: 동시에 충전 완료 처리
      const results = await Promise.all(
        chargeRequests.map((req) =>
          pointService.verifyAndCompleteCharge(req.getChargeRequestId(), `payment-${req.getChargeRequestId()}`),
        ),
      );

      // Then: 모든 충전이 성공하고 최종 잔액이 정확하다
      const finalBalance = await pointService.getBalance(userId);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.getStatus()).toBe(ChargeStatus.COMPLETED);
      });

      // 초기 10000 + (5000 * 3) = 25000
      expect(finalBalance.getBalance().getValue()).toBe(25000);
    });

    it('같은 충전 요청을 여러 번 동시에 처리해도 멱등성이 보장된다', async () => {
      // Given: 사용자의 초기 잔액 설정
      const userId = 'user-idempotent-charge';
      const initialBalance = new PointBalance(userId, new Point(10000), new Date());
      await pointRepository.saveBalance(initialBalance);

      // 충전 요청 생성
      const chargeAmount = new Point(5000);
      const chargeRequest = await pointService.createChargeRequest(userId, chargeAmount);

      // PG 결제 정보 등록
      mockPGClient.mockPayment(
        `payment-${chargeRequest.getChargeRequestId()}`,
        chargeAmount.getValue(),
        PaymentStatus.SUCCESS,
      );

      // When: 같은 충전 요청을 동시에 여러 번 처리
      const results = await Promise.all([
        pointService.verifyAndCompleteCharge(
          chargeRequest.getChargeRequestId(),
          `payment-${chargeRequest.getChargeRequestId()}`,
        ),
        pointService.verifyAndCompleteCharge(
          chargeRequest.getChargeRequestId(),
          `payment-${chargeRequest.getChargeRequestId()}`,
        ),
        pointService.verifyAndCompleteCharge(
          chargeRequest.getChargeRequestId(),
          `payment-${chargeRequest.getChargeRequestId()}`,
        ),
      ]);

      // Then: 모든 요청이 성공하지만 충전은 한 번만 적용된다
      const finalBalance = await pointService.getBalance(userId);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.getStatus()).toBe(ChargeStatus.COMPLETED);
      });

      // 초기 10000 + 5000 (한 번만) = 15000
      expect(finalBalance.getBalance().getValue()).toBe(15000);
    });
  });

  describe('주문 생성 동시성 제어', () => {
    const setupProductAndBalance = async (userId: string, stock: number, balance: number) => {
      // 상품 옵션 설정
      const productOption = new ProductOption(
        'option-1',
        'product-1',
        'Test Option',
        1000,
        stock,
        new Date(),
        new Date(),
      );
      await productRepository.saveOption(productOption);

      // 포인트 잔액 설정
      const pointBalance = new PointBalance(userId, new Point(balance), new Date());
      await pointRepository.saveBalance(pointBalance);

      return productOption;
    };

    it('같은 사용자가 동시에 여러 주문을 시도하면 순차적으로 처리된다', async () => {
      // Given: 재고 10개, 잔액 10000원
      const userId = 'user-concurrent-order';
      const productOption = await setupProductAndBalance(userId, 10, 10000);

      // When: 동시에 3번 주문 (각 1개씩, 1000원)
      const orderItems = [{ productOptionId: productOption.getId(), quantity: 1 }];
      const orderPromises = [
        orderService.createOrder(userId, orderItems, 1000),
        orderService.createOrder(userId, orderItems, 1000),
        orderService.createOrder(userId, orderItems, 1000),
      ];

      const results = await Promise.allSettled(orderPromises);

      // Then: 모든 주문이 성공한다
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      expect(successCount).toBe(3);

      // 재고 확인: 10 - 3 = 7
      const updatedOption = await productRepository.findOptionById(productOption.getId());
      expect(updatedOption?.getStock()).toBe(7);

      // 포인트 확인: 10000 - 3000 = 7000
      const finalBalance = await pointService.getBalance(userId);
      expect(finalBalance.getBalance().getValue()).toBe(7000);
    }, 30000); // 30초 타임아웃

    it('같은 사용자가 재고보다 많은 수량을 동시에 주문하면 일부만 성공한다', async () => {
      // Given: 재고 5개, 잔액 충분
      const userId = 'user-limited-stock';
      const productOption = await setupProductAndBalance(userId, 5, 100000);

      // When: 동시에 3번 주문 (각 2개씩 = 총 6개 시도)
      const orderItems = [{ productOptionId: productOption.getId(), quantity: 2 }];
      const orderPromises = [
        orderService.createOrder(userId, orderItems, 2000),
        orderService.createOrder(userId, orderItems, 2000),
        orderService.createOrder(userId, orderItems, 2000),
      ];

      const results = await Promise.allSettled(orderPromises);

      // Then: 2번만 성공 (4개 차감), 1번은 실패
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failureCount = results.filter((r) => r.status === 'rejected').length;

      expect(successCount).toBe(2);
      expect(failureCount).toBe(1);

      // 재고 확인: 5 - 4 = 1
      const updatedOption = await productRepository.findOptionById(productOption.getId());
      expect(updatedOption?.getStock()).toBe(1);

      // 포인트 확인: 100000 - 4000 = 96000
      const finalBalance = await pointService.getBalance(userId);
      expect(finalBalance.getBalance().getValue()).toBe(96000);
    }, 30000);

    it('같은 사용자가 잔액보다 많은 금액을 동시에 주문하면 일부만 성공한다', async () => {
      // Given: 재고 충분, 잔액 5000원
      const userId = 'user-limited-balance';
      const productOption = await setupProductAndBalance(userId, 100, 5000);

      // When: 동시에 3번 주문 (각 2000원)
      const orderItems = [{ productOptionId: productOption.getId(), quantity: 2 }];
      const orderPromises = [
        orderService.createOrder(userId, orderItems, 2000),
        orderService.createOrder(userId, orderItems, 2000),
        orderService.createOrder(userId, orderItems, 2000),
      ];

      const results = await Promise.allSettled(orderPromises);

      // Then: 2번만 성공 (4000원 차감), 1번은 실패
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failureCount = results.filter((r) => r.status === 'rejected').length;

      expect(successCount).toBe(2);
      expect(failureCount).toBe(1);

      // 재고 확인: 100 - 4 = 96
      const updatedOption = await productRepository.findOptionById(productOption.getId());
      expect(updatedOption?.getStock()).toBe(96);

      // 포인트 확인: 5000 - 4000 = 1000
      const finalBalance = await pointService.getBalance(userId);
      expect(finalBalance.getBalance().getValue()).toBe(1000);
    }, 30000);
  });

  describe('주문 취소 동시성 제어', () => {
    it('같은 사용자가 동시에 여러 주문을 취소해도 재고와 포인트가 정확하게 복구된다', async () => {
      // Given: 주문 생성
      const userId = 'user-concurrent-cancel';
      const productOption = new ProductOption(
        'option-1',
        'product-1',
        'Test Option',
        1000,
        100,
        new Date(),
        new Date(),
      );
      await productRepository.saveOption(productOption);

      const pointBalance = new PointBalance(userId, new Point(10000), new Date());
      await pointRepository.saveBalance(pointBalance);

      // 3개의 주문 생성
      const orderItems = [{ productOptionId: productOption.getId(), quantity: 2 }];
      const orders = await Promise.all([
        orderService.createOrder(userId, orderItems, 2000),
        orderService.createOrder(userId, orderItems, 2000),
        orderService.createOrder(userId, orderItems, 2000),
      ]);

      // When: 동시에 모든 주문 취소
      await Promise.all(orders.map((order) => orderService.updateOrderStatus(userId, order.getId(), 'CANCELLED')));

      // Then: 재고와 포인트가 원래대로 복구
      const updatedOption = await productRepository.findOptionById(productOption.getId());
      expect(updatedOption?.getStock()).toBe(100); // 100 - 6 + 6 = 100

      const finalBalance = await pointService.getBalance(userId);
      expect(finalBalance.getBalance().getValue()).toBe(10000); // 10000 - 6000 + 6000 = 10000
    });
  });

  describe('혼합 시나리오 동시성 제어', () => {
    it('같은 사용자가 동시에 충전과 주문을 시도하면 순차적으로 처리된다', async () => {
      // Given: 초기 잔액 10000원 (충분한 잔액으로 설정), 재고 10개
      const userId = 'user-mixed-scenario';
      const productOption = new ProductOption('option-1', 'product-1', 'Test Option', 3000, 10, new Date(), new Date());
      await productRepository.saveOption(productOption);

      const pointBalance = new PointBalance(userId, new Point(10000), new Date());
      await pointRepository.saveBalance(pointBalance);

      // 충전 요청 생성
      const chargeRequest = await pointService.createChargeRequest(userId, new Point(5000));
      mockPGClient.mockPayment(`payment-${chargeRequest.getChargeRequestId()}`, 5000, PaymentStatus.SUCCESS);

      // When: 동시에 충전 완료와 주문 처리
      const orderItems = [{ productOptionId: productOption.getId(), quantity: 2 }];
      const [chargeResult, ...orderResults] = await Promise.allSettled([
        pointService.verifyAndCompleteCharge(
          chargeRequest.getChargeRequestId(),
          `payment-${chargeRequest.getChargeRequestId()}`,
        ),
        orderService.createOrder(userId, orderItems, 6000),
        orderService.createOrder(userId, orderItems, 6000),
      ]);

      // Then: 모든 작업이 순차적으로 처리되어 데이터 정합성이 유지됨
      expect(chargeResult.status).toBe('fulfilled');

      // 최소 1개 이상의 주문 성공 (실행 순서에 따라 1개 또는 2개 성공)
      const successfulOrders = orderResults.filter((r) => r.status === 'fulfilled').length;
      expect(successfulOrders).toBeGreaterThanOrEqual(1);
      expect(successfulOrders).toBeLessThanOrEqual(2);

      // 최종 잔액 확인 (충전 5000 + 초기 10000 - 주문 금액)
      const finalBalance = await pointService.getBalance(userId);
      const expectedBalance = 15000 - successfulOrders * 6000;
      expect(finalBalance.getBalance().getValue()).toBe(expectedBalance);

      // 재고 확인
      const updatedOption = await productRepository.findOptionById(productOption.getId());
      expect(updatedOption?.getStock()).toBe(10 - successfulOrders * 2);
    });
  });

  describe('쿠폰 발급 동시성 제어', () => {
    it('여러 사용자가 동시에 한정 쿠폰을 발급받으면 정확히 발급 수량만큼만 발급된다', async () => {
      // given: 수량이 1개인 쿠폰 생성
      const limitedCoupon = new Coupon(
        'coupon-limited-concurrent',
        '한정 동시성 테스트 쿠폰',
        new DiscountValue(DiscountType.FIXED, 5000),
        null,
        new Point(20000),
        new CouponQuantity(1, 0),
        new ValidityPeriod(new Date('2025-01-01'), new Date('2025-12-31')),
        new Date('2025-01-01'),
      );
      await couponRepository.saveCoupon(limitedCoupon);

      const users = ['user-concurrent-1', 'user-concurrent-2', 'user-concurrent-3'];

      // when: 3명의 사용자가 동시에 쿠폰 발급 시도
      const results = await Promise.allSettled(
        users.map((userId) => couponService.issueCoupon(limitedCoupon.getId(), userId)),
      );

      // then: 1명만 성공, 2명은 실패
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failureCount = results.filter((r) => r.status === 'rejected').length;

      expect(successCount).toBe(1);
      expect(failureCount).toBe(2);

      // 쿠폰 재고 확인
      const updatedCoupon = await couponRepository.findCouponById(limitedCoupon.getId());
      expect(updatedCoupon?.getQuantity().getIssuedQuantity()).toBe(1);
      expect(updatedCoupon?.getQuantity().canIssue()).toBe(false);
    });
  });
});
