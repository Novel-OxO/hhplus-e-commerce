import { Test, TestingModule } from '@nestjs/testing';
import { CouponService } from '@/application/coupon.service';
import { CouponQuantity } from '@/domain/coupon/coupon-quantity.vo';
import { Coupon } from '@/domain/coupon/coupon.entity';
import { COUPON_REPOSITORY, type CouponRepository } from '@/domain/coupon/coupon.repository';
import { DiscountType } from '@/domain/coupon/discount-type.vo';
import { DiscountValue } from '@/domain/coupon/discount-value.vo';
import { UserCouponStatistics } from '@/domain/coupon/user-coupon-statistics.vo';
import { UserCoupon } from '@/domain/coupon/user-coupon.entity';
import { ValidityPeriod } from '@/domain/coupon/validity-period.vo';
import { Point } from '@/domain/point/point.vo';
import { BadRequestException, NotFoundException } from '@/common/exceptions';
import { ID_GENERATOR, type IdGenerator } from '@/infrastructure/id-generator/id-generator.interface';

describe('CouponService', () => {
  let service: CouponService;
  let repository: jest.Mocked<CouponRepository>;
  let idGenerator: jest.Mocked<IdGenerator>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<CouponRepository> = {
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

    const mockIdGenerator: jest.Mocked<IdGenerator> = {
      generate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponService,
        {
          provide: COUPON_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: ID_GENERATOR,
          useValue: mockIdGenerator,
        },
      ],
    }).compile();

    service = module.get<CouponService>(CouponService);
    repository = module.get(COUPON_REPOSITORY);
    idGenerator = module.get(ID_GENERATOR);
  });

  describe('issueCoupon', () => {
    it('정상적으로 쿠폰을 발급한다', async () => {
      // given
      const couponId = 'coupon123';
      const userId = 'user123';
      const issuedAt = new Date('2025-01-15');
      const generatedId = 'userCoupon123';

      const coupon = new Coupon(
        couponId,
        '신년 할인 쿠폰',
        new DiscountValue(DiscountType.PERCENTAGE, 10),
        new Point(5000),
        new Point(10000),
        new CouponQuantity(100, 50),
        new ValidityPeriod(new Date('2025-01-01'), new Date('2025-12-31')),
        new Date('2025-01-01'),
      );

      repository.existsUserCouponByCouponIdAndUserId.mockResolvedValue(false);
      repository.findCouponByIdWithLock.mockResolvedValue(coupon);
      idGenerator.generate.mockReturnValue(generatedId);

      // when
      const result = await service.issueCoupon(couponId, userId, issuedAt);

      // then
      expect(result.getId()).toBe(generatedId);
      expect(result.getUserId()).toBe(userId);
      expect(result.getCouponId()).toBe(couponId);
      expect(result.getIssuedAt()).toBe(issuedAt);
      expect(result.isUsed()).toBe(false);
    });

    it('이미 발급받은 쿠폰이면 예외를 발생시킨다', async () => {
      // given
      const couponId = 'coupon123';
      const userId = 'user123';

      repository.existsUserCouponByCouponIdAndUserId.mockResolvedValue(true);

      // when & then
      await expect(service.issueCoupon(couponId, userId)).rejects.toThrow(BadRequestException);
      await expect(service.issueCoupon(couponId, userId)).rejects.toThrow('이미 발급받은 쿠폰입니다.');
    });

    it('쿠폰을 찾을 수 없으면 예외를 발생시킨다', async () => {
      // given
      const couponId = 'nonexistent';
      const userId = 'user123';

      repository.existsUserCouponByCouponIdAndUserId.mockResolvedValue(false);
      repository.findCouponByIdWithLock.mockResolvedValue(null);

      // when & then
      await expect(service.issueCoupon(couponId, userId)).rejects.toThrow(NotFoundException);
      await expect(service.issueCoupon(couponId, userId)).rejects.toThrow('쿠폰을 찾을 수 없습니다.');
    });

    it('쿠폰 발급 기간이 아니면 예외를 발생시킨다', async () => {
      // given
      const couponId = 'coupon123';
      const userId = 'user123';
      const issuedAt = new Date('2026-01-15'); // 유효 기간 이후

      const coupon = new Coupon(
        couponId,
        '신년 할인 쿠폰',
        new DiscountValue(DiscountType.PERCENTAGE, 10),
        new Point(5000),
        new Point(10000),
        new CouponQuantity(100, 50),
        new ValidityPeriod(new Date('2025-01-01'), new Date('2025-12-31')),
        new Date('2025-01-01'),
      );

      repository.existsUserCouponByCouponIdAndUserId.mockResolvedValue(false);
      repository.findCouponByIdWithLock.mockResolvedValue(coupon);

      // when & then
      await expect(service.issueCoupon(couponId, userId, issuedAt)).rejects.toThrow(BadRequestException);
      await expect(service.issueCoupon(couponId, userId, issuedAt)).rejects.toThrow('쿠폰을 발급할 수 없습니다.');
    });

    it('쿠폰 발급 수량이 모두 소진되면 예외를 발생시킨다', async () => {
      // given
      const couponId = 'coupon123';
      const userId = 'user123';
      const issuedAt = new Date('2025-01-15');

      const coupon = new Coupon(
        couponId,
        '신년 할인 쿠폰',
        new DiscountValue(DiscountType.PERCENTAGE, 10),
        new Point(5000),
        new Point(10000),
        new CouponQuantity(100, 100), // 모두 발급됨
        new ValidityPeriod(new Date('2025-01-01'), new Date('2025-12-31')),
        new Date('2025-01-01'),
      );

      repository.existsUserCouponByCouponIdAndUserId.mockResolvedValue(false);
      repository.findCouponByIdWithLock.mockResolvedValue(coupon);

      // when & then
      await expect(service.issueCoupon(couponId, userId, issuedAt)).rejects.toThrow(BadRequestException);
      await expect(service.issueCoupon(couponId, userId, issuedAt)).rejects.toThrow('쿠폰을 발급할 수 없습니다.');
    });
  });

  describe('getMyCoupons', () => {
    it('사용자의 모든 쿠폰을 조회한다', async () => {
      // given
      const userId = 'user123';
      const userCoupons = [
        new UserCoupon(
          'userCoupon1',
          userId,
          'coupon1',
          new Date('2025-01-01'),
          new ValidityPeriod(new Date('2025-01-01'), new Date('2025-12-31')),
        ),
        new UserCoupon(
          'userCoupon2',
          userId,
          'coupon2',
          new Date('2025-01-02'),
          new ValidityPeriod(new Date('2025-01-01'), new Date('2025-12-31')),
        ),
      ];

      repository.findUserCouponsByUserId.mockResolvedValue(userCoupons);

      // when
      const result = await service.getMyCoupons(userId);

      // then
      expect(result).toHaveLength(2);
      expect(result).toEqual(userCoupons);
    });

    it('쿠폰이 없으면 빈 배열을 반환한다', async () => {
      // given
      const userId = 'user123';

      repository.findUserCouponsByUserId.mockResolvedValue([]);

      // when
      const result = await service.getMyCoupons(userId);

      // then
      expect(result).toEqual([]);
    });
  });

  describe('getMyCouponsWithStatistics', () => {
    it('사용자의 쿠폰과 통계 정보를 조회한다', async () => {
      // given
      const userId = 'user123';
      const at = new Date('2025-06-15');
      const userCoupons = [
        new UserCoupon(
          'userCoupon1',
          userId,
          'coupon1',
          new Date('2025-01-01'),
          new ValidityPeriod(new Date('2025-01-01'), new Date('2025-12-31')),
        ),
        new UserCoupon(
          'userCoupon2',
          userId,
          'coupon2',
          new Date('2025-01-02'),
          new ValidityPeriod(new Date('2025-01-01'), new Date('2025-06-30')),
          new Date('2025-06-01'),
          'order1',
        ),
      ];

      repository.findUserCouponsByUserId.mockResolvedValue(userCoupons);

      // when
      const result = await service.getMyCouponsWithStatistics(userId, at);

      // then
      expect(result).toBeInstanceOf(UserCouponStatistics);
    });
  });
});
