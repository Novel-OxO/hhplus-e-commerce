/* eslint-disable @typescript-eslint/require-await */
import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from '@/application/order.service';
import { BadRequestException, NotFoundException } from '@/common/exceptions';
import { CART_REPOSITORY, type CartRepository } from '@/domain/cart/cart.repository';
import { CouponQuantity } from '@/domain/coupon/coupon-quantity.vo';
import { Coupon } from '@/domain/coupon/coupon.entity';
import { COUPON_REPOSITORY, type CouponRepository } from '@/domain/coupon/coupon.repository';
import { DiscountType } from '@/domain/coupon/discount-type.vo';
import { DiscountValue } from '@/domain/coupon/discount-value.vo';
import { UserCoupon } from '@/domain/coupon/user-coupon.entity';
import { ValidityPeriod } from '@/domain/coupon/validity-period.vo';
import { ORDER_REPOSITORY, type OrderRepository } from '@/domain/order/order.repository';
import { PointBalance } from '@/domain/point/point-balance.entity';
import { POINT_REPOSITORY, type PointRepository } from '@/domain/point/point.repository';
import { Point } from '@/domain/point/point.vo';
import { ProductOption } from '@/domain/product/product-option.entity';
import { PRODUCT_REPOSITORY, type ProductRepository } from '@/domain/product/product.repository';
import { ID_GENERATOR, type IdGenerator } from '@/infrastructure/id-generator/id-generator.interface';

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: jest.Mocked<OrderRepository>;
  let productRepository: jest.Mocked<ProductRepository>;
  let pointRepository: jest.Mocked<PointRepository>;
  let couponRepository: jest.Mocked<CouponRepository>;
  let cartRepository: jest.Mocked<CartRepository>;
  let idGenerator: jest.Mocked<IdGenerator>;

  beforeEach(async () => {
    const mockOrderRepository: jest.Mocked<OrderRepository> = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByIdWithLock: jest.fn(),
      saveItems: jest.fn(),
      findItemsByOrderId: jest.fn(),
    };

    const mockProductRepository: jest.Mocked<ProductRepository> = {
      findById: jest.fn(),
      findOptionsByProductId: jest.fn(),
      findOptionById: jest.fn(),
      findPopularByPeriod: jest.fn(),
      saveOption: jest.fn(),
      findOptionByIdWithLock: jest.fn(),
      saveProduct: jest.fn(),
    };

    const mockPointRepository: jest.Mocked<PointRepository> = {
      findBalanceByUserId: jest.fn(),
      saveBalance: jest.fn(),
      saveChargeRequest: jest.fn(),
      findChargeRequestById: jest.fn(),
      createTransaction: jest.fn(),
      updateChargeRequestStatus: jest.fn(),
    };

    const mockCouponRepository: jest.Mocked<CouponRepository> = {
      findCouponById: jest.fn(),
      findAvailableCoupons: jest.fn(),
      saveCoupon: jest.fn(),
      findCouponByIdWithLock: jest.fn(),
      findUserCouponById: jest.fn(),
      findUserCouponsByUserId: jest.fn(),
      findAvailableUserCouponsByUserId: jest.fn(),
      existsUserCouponByCouponIdAndUserId: jest.fn(),
      saveUserCoupon: jest.fn(),
      findHistoriesByUserId: jest.fn(),
      findHistoriesByUserIdWithPagination: jest.fn(),
      saveHistory: jest.fn(),
    };

    const mockCartRepository: jest.Mocked<CartRepository> = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
      findByUserIdAndProductOptionId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      deleteByUserId: jest.fn(),
    };

    const mockIdGenerator: jest.Mocked<IdGenerator> = {
      generate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: ORDER_REPOSITORY,
          useValue: mockOrderRepository,
        },
        {
          provide: PRODUCT_REPOSITORY,
          useValue: mockProductRepository,
        },
        {
          provide: POINT_REPOSITORY,
          useValue: mockPointRepository,
        },
        {
          provide: COUPON_REPOSITORY,
          useValue: mockCouponRepository,
        },
        {
          provide: CART_REPOSITORY,
          useValue: mockCartRepository,
        },
        {
          provide: ID_GENERATOR,
          useValue: mockIdGenerator,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get(ORDER_REPOSITORY);
    productRepository = module.get(PRODUCT_REPOSITORY);
    pointRepository = module.get(POINT_REPOSITORY);
    couponRepository = module.get(COUPON_REPOSITORY);
    cartRepository = module.get(CART_REPOSITORY);
    idGenerator = module.get(ID_GENERATOR);
  });

  describe('createOrder', () => {
    it('정상적으로 주문을 생성한다', async () => {
      // given
      const userId = 'user123';
      const items = [{ productOptionId: 'option1', quantity: 2 }];
      const expectedAmount = 10000;

      const productOption = new ProductOption('option1', 'product1', 'Red-M', 5000, 10, new Date(), new Date());

      const pointBalance = new PointBalance(userId, new Point(50000));

      idGenerator.generate.mockReturnValueOnce('order123');
      idGenerator.generate.mockReturnValueOnce('orderItem123');
      idGenerator.generate.mockReturnValueOnce('transaction123');

      productRepository.findOptionByIdWithLock.mockResolvedValue(productOption);
      pointRepository.findBalanceByUserId.mockResolvedValue(pointBalance);
      pointRepository.saveBalance.mockResolvedValue(pointBalance);
      productRepository.saveOption.mockResolvedValue(productOption);
      orderRepository.save.mockImplementation(async (order) => order);
      orderRepository.saveItems.mockResolvedValue(undefined);
      pointRepository.createTransaction.mockResolvedValue({} as any);
      cartRepository.findByUserIdAndProductOptionId.mockResolvedValue(null);

      // when
      const result = await service.createOrder(userId, items, expectedAmount);

      // then
      expect(result.getId()).toBe('order123');
      expect(result.getUserId()).toBe(userId);
      expect(result.getItems()).toHaveLength(1);
      expect(result.getOrderAmount().getValue()).toBe(10000);
      expect(result.getDiscountAmount().getValue()).toBe(0);
      expect(result.getFinalAmount().getValue()).toBe(10000);
      expect(result.getStatus().getValue()).toBe('PENDING');
    });

    it('쿠폰을 적용하여 주문을 생성한다', async () => {
      // given
      const userId = 'user123';
      const items = [{ productOptionId: 'option1', quantity: 2 }];
      const expectedAmount = 9000;
      const userCouponId = 'userCoupon123';

      const productOption = new ProductOption('option1', 'product1', 'Red-M', 5000, 10, new Date(), new Date());

      const coupon = new Coupon(
        'coupon123',
        '10% 할인 쿠폰',
        new DiscountValue(DiscountType.PERCENTAGE, 10),
        null, // maxDiscountAmount
        new Point(5000), // minOrderAmount
        new CouponQuantity(100, 50),
        new ValidityPeriod(new Date('2025-01-01'), new Date('2025-12-31')),
        new Date('2025-01-01'),
      );

      const userCoupon = new UserCoupon(
        userCouponId,
        userId,
        'coupon123',
        new Date('2025-01-15'),
        new ValidityPeriod(new Date('2025-01-15'), new Date('2025-12-31')),
      );

      const pointBalance = new PointBalance(userId, new Point(50000));

      idGenerator.generate.mockReturnValueOnce('order123');
      idGenerator.generate.mockReturnValueOnce('orderItem123');
      idGenerator.generate.mockReturnValueOnce('transaction123');
      idGenerator.generate.mockReturnValueOnce('history123');

      productRepository.findOptionByIdWithLock.mockResolvedValue(productOption);
      couponRepository.findUserCouponById.mockResolvedValue(userCoupon);
      couponRepository.findCouponById.mockResolvedValue(coupon);
      pointRepository.findBalanceByUserId.mockResolvedValue(pointBalance);
      pointRepository.saveBalance.mockResolvedValue(pointBalance);
      productRepository.saveOption.mockResolvedValue(productOption);
      orderRepository.save.mockImplementation(async (order) => order);
      orderRepository.saveItems.mockResolvedValue(undefined);
      pointRepository.createTransaction.mockResolvedValue({} as any);
      couponRepository.saveUserCoupon.mockResolvedValue(undefined);
      couponRepository.saveHistory.mockResolvedValue(undefined);
      cartRepository.findByUserIdAndProductOptionId.mockResolvedValue(null);

      // when
      const result = await service.createOrder(userId, items, expectedAmount, userCouponId);

      // then
      expect(result.getOrderAmount().getValue()).toBe(10000);
      expect(result.getDiscountAmount().getValue()).toBe(1000);
      expect(result.getFinalAmount().getValue()).toBe(9000);
      expect(result.hasCoupon()).toBe(true);
      expect(result.getUserCouponId()).toBe(userCouponId);
    });

    it('주문 항목이 없으면 예외를 발생시킨다', async () => {
      // given
      const userId = 'user123';
      const items: any[] = [];
      const expectedAmount = 0;

      // when & then
      await expect(service.createOrder(userId, items, expectedAmount)).rejects.toThrow(BadRequestException);
      await expect(service.createOrder(userId, items, expectedAmount)).rejects.toThrow('주문 항목이 없습니다.');
    });

    it('상품 옵션을 찾을 수 없으면 예외를 발생시킨다', async () => {
      // given
      const userId = 'user123';
      const items = [{ productOptionId: 'nonexistent', quantity: 1 }];
      const expectedAmount = 5000;

      productRepository.findOptionByIdWithLock.mockResolvedValue(null);

      // when & then
      await expect(service.createOrder(userId, items, expectedAmount)).rejects.toThrow(NotFoundException);
      await expect(service.createOrder(userId, items, expectedAmount)).rejects.toThrow('상품 옵션을 찾을 수 없습니다');
    });

    it('재고가 부족하면 예외를 발생시킨다', async () => {
      // given
      const userId = 'user123';
      const items = [{ productOptionId: 'option1', quantity: 20 }];
      const expectedAmount = 100000;

      const productOption = new ProductOption('option1', 'product1', 'Red-M', 5000, 10, new Date(), new Date());

      productRepository.findOptionByIdWithLock.mockResolvedValue(productOption);

      // when & then
      await expect(service.createOrder(userId, items, expectedAmount)).rejects.toThrow(BadRequestException);
      await expect(service.createOrder(userId, items, expectedAmount)).rejects.toThrow('재고가 부족합니다');
    });

    it('포인트 잔액이 부족하면 예외를 발생시킨다', async () => {
      // given
      const userId = 'user123';
      const items = [{ productOptionId: 'option1', quantity: 2 }];
      const expectedAmount = 10000;

      const productOption = new ProductOption('option1', 'product1', 'Red-M', 5000, 10, new Date(), new Date());

      const pointBalance = new PointBalance(userId, new Point(5000)); // 부족한 잔액

      productRepository.findOptionByIdWithLock.mockResolvedValue(productOption);
      pointRepository.findBalanceByUserId.mockResolvedValue(pointBalance);

      // when & then
      await expect(service.createOrder(userId, items, expectedAmount)).rejects.toThrow(BadRequestException);
      await expect(service.createOrder(userId, items, expectedAmount)).rejects.toThrow('포인트 잔액이 부족합니다');
    });

    it('예상 금액과 실제 금액이 다르면 예외를 발생시킨다', async () => {
      // given
      const userId = 'user123';
      const items = [{ productOptionId: 'option1', quantity: 2 }];
      const expectedAmount = 8000; // 실제는 10000

      const productOption = new ProductOption('option1', 'product1', 'Red-M', 5000, 10, new Date(), new Date());

      const pointBalance = new PointBalance(userId, new Point(50000));

      productRepository.findOptionByIdWithLock.mockResolvedValue(productOption);
      pointRepository.findBalanceByUserId.mockResolvedValue(pointBalance);

      // when & then
      await expect(service.createOrder(userId, items, expectedAmount)).rejects.toThrow(BadRequestException);
      await expect(service.createOrder(userId, items, expectedAmount)).rejects.toThrow('금액이 일치하지 않습니다');
    });

    it('존재하지 않는 쿠폰이면 예외를 발생시킨다', async () => {
      // given
      const userId = 'user123';
      const items = [{ productOptionId: 'option1', quantity: 2 }];
      const expectedAmount = 10000;
      const userCouponId = 'nonexistent';

      const productOption = new ProductOption('option1', 'product1', 'Red-M', 5000, 10, new Date(), new Date());

      productRepository.findOptionByIdWithLock.mockResolvedValue(productOption);
      couponRepository.findUserCouponById.mockResolvedValue(null);

      // when & then
      await expect(service.createOrder(userId, items, expectedAmount, userCouponId)).rejects.toThrow(NotFoundException);
      await expect(service.createOrder(userId, items, expectedAmount, userCouponId)).rejects.toThrow(
        '쿠폰을 찾을 수 없습니다',
      );
    });
  });

  describe('getOrder', () => {
    it('주문을 조회한다', async () => {
      // given
      const userId = 'user123';
      const orderId = 'order123';

      const order = {
        getId: () => orderId,
        getUserId: () => userId,
        getStatus: () => ({ getValue: () => 'PENDING' }),
      };

      orderRepository.findById.mockResolvedValue(order as any);

      // when
      const result = await service.getOrder(userId, orderId);

      // then
      expect(result.getId()).toBe(orderId);
      expect(result.getUserId()).toBe(userId);
    });

    it('주문을 찾을 수 없으면 예외를 발생시킨다', async () => {
      // given
      const userId = 'user123';
      const orderId = 'nonexistent';

      orderRepository.findById.mockResolvedValue(null);

      // when & then
      await expect(service.getOrder(userId, orderId)).rejects.toThrow(NotFoundException);
      await expect(service.getOrder(userId, orderId)).rejects.toThrow('주문을 찾을 수 없습니다');
    });

    it('다른 사용자의 주문을 조회하면 예외를 발생시킨다', async () => {
      // given
      const userId = 'user123';
      const orderId = 'order123';

      const order = {
        getId: () => orderId,
        getUserId: () => 'otherUser',
      };

      orderRepository.findById.mockResolvedValue(order as any);

      // when & then
      await expect(service.getOrder(userId, orderId)).rejects.toThrow(BadRequestException);
      await expect(service.getOrder(userId, orderId)).rejects.toThrow('본인의 주문만 조회할 수 있습니다');
    });
  });

  describe('updateOrderStatus', () => {
    it('주문을 완료 상태로 변경한다', async () => {
      // given
      const userId = 'user123';
      const orderId = 'order123';
      const status = 'COMPLETED';

      const order = {
        getId: () => orderId,
        getUserId: () => userId,
        getStatus: () => ({ getValue: () => 'COMPLETED', isPending: () => true }),
        complete: jest.fn(),
      };

      orderRepository.findByIdWithLock.mockResolvedValue(order as any);
      orderRepository.save.mockImplementation(async (o) => o);

      // when
      const result = await service.updateOrderStatus(userId, orderId, status);

      // then
      expect(result.getId()).toBe(orderId);
    });

    it('주문을 취소 상태로 변경한다', async () => {
      // given
      const userId = 'user123';
      const orderId = 'order123';
      const status = 'CANCELLED';

      const order = {
        getId: () => orderId,
        getUserId: () => userId,
        getItems: () => [],
        getFinalAmount: () => new Point(10000),
        hasCoupon: () => false,
        getStatus: () => ({ getValue: () => 'CANCELLED', isCancelled: () => false, isCompleted: () => false }),
        cancel: jest.fn(),
      };

      const pointBalance = new PointBalance(userId, new Point(40000));

      orderRepository.findByIdWithLock.mockResolvedValue(order as any);
      pointRepository.findBalanceByUserId.mockResolvedValue(pointBalance);
      pointRepository.saveBalance.mockResolvedValue(pointBalance);
      idGenerator.generate.mockReturnValue('transaction123');
      pointRepository.createTransaction.mockResolvedValue({} as any);
      orderRepository.save.mockImplementation(async (o) => o);

      // when
      const result = await service.updateOrderStatus(userId, orderId, status);

      // then
      expect(result.getId()).toBe(orderId);
    });

    it('주문을 찾을 수 없으면 예외를 발생시킨다', async () => {
      // given
      const userId = 'user123';
      const orderId = 'nonexistent';
      const status = 'COMPLETED';

      orderRepository.findByIdWithLock.mockResolvedValue(null);

      // when & then
      await expect(service.updateOrderStatus(userId, orderId, status)).rejects.toThrow(NotFoundException);
      await expect(service.updateOrderStatus(userId, orderId, status)).rejects.toThrow('주문을 찾을 수 없습니다');
    });

    it('다른 사용자의 주문 상태를 변경하면 예외를 발생시킨다', async () => {
      // given
      const userId = 'user123';
      const orderId = 'order123';
      const status = 'COMPLETED';

      const order = {
        getId: () => orderId,
        getUserId: () => 'otherUser',
      };

      orderRepository.findByIdWithLock.mockResolvedValue(order as any);

      // when & then
      await expect(service.updateOrderStatus(userId, orderId, status)).rejects.toThrow(BadRequestException);
      await expect(service.updateOrderStatus(userId, orderId, status)).rejects.toThrow(
        '본인의 주문만 수정할 수 있습니다',
      );
    });
  });
});
