import { CouponService } from '@/application/coupon/coupon.service';
import { BadRequestException } from '@/common/exceptions';
import { CouponQuantity } from '@/domain/coupon/coupon-quantity.vo';
import { Coupon } from '@/domain/coupon/coupon.entity';
import { type CouponRepository } from '@/domain/coupon/coupon.repository';
import { DiscountType } from '@/domain/coupon/discount-type.vo';
import { DiscountValue } from '@/domain/coupon/discount-value.vo';
import { UserCoupon } from '@/domain/coupon/user-coupon.entity';
import { ValidityPeriod } from '@/domain/coupon/validity-period.vo';
import { Point } from '@/domain/point/point.vo';

describe('CouponService - issueCoupon', () => {
  let couponService: CouponService;
  let mockCouponRepository: jest.Mocked<CouponRepository>;

  const userId = 'user-123';
  const couponId = 'coupon-123';
  const issuedAt = new Date('2025-11-10T00:00:00Z');

  beforeEach(() => {
    mockCouponRepository = {
      findCouponById: jest.fn(),
      findAvailableCoupons: jest.fn(),
      saveCoupon: jest.fn(),
      findCouponByIdWithLock: jest.fn(),
      findCouponByIdWithLockOrElseThrow: jest.fn(),
      findUserCouponById: jest.fn(),
      findUserCouponByIdOrElseThrow: jest.fn(),
      findUserCouponsByUserId: jest.fn(),
      findAvailableUserCouponsByUserId: jest.fn(),
      existsUserCouponByCouponIdAndUserId: jest.fn(),
      saveUserCoupon: jest.fn(),
    };

    couponService = new CouponService(mockCouponRepository);
  });

  describe('정상 케이스', () => {
    it('발급 가능한 쿠폰을 사용자에게 발급할 수 있다', async () => {
      // given
      const coupon = new Coupon(
        couponId,
        '10% 할인 쿠폰',
        new DiscountValue(DiscountType.PERCENTAGE, 10),
        new Point(5000), // maxDiscountAmount
        new Point(10000), // minOrderAmount
        new CouponQuantity(100, 50), // 총 100개 중 50개 발급됨
        new ValidityPeriod(new Date('2025-11-01'), new Date('2025-12-31')),
        new Date(),
        new Date(),
      );

      mockCouponRepository.existsUserCouponByCouponIdAndUserId.mockResolvedValue(false);
      mockCouponRepository.findCouponByIdWithLockOrElseThrow.mockResolvedValue(coupon);
      mockCouponRepository.saveCoupon.mockResolvedValue();
      mockCouponRepository.saveUserCoupon.mockResolvedValue();

      // when
      const result = await couponService.issueCoupon(couponId, userId, issuedAt);

      // then
      expect(result).toBeInstanceOf(UserCoupon);
      expect(result.getUserId()).toBe(userId);
      expect(result.getCoupon()).toBe(coupon);
      expect(result.getIssuedAt()).toEqual(issuedAt);
      expect(result.isUsed()).toBe(false);
    });

    it('쿠폰 발급 후 수량이 감소한다', async () => {
      // given
      const coupon = new Coupon(
        couponId,
        '10% 할인 쿠폰',
        new DiscountValue(DiscountType.PERCENTAGE, 10),
        new Point(5000),
        new Point(10000),
        new CouponQuantity(100, 50), // 50개 발급됨
        new ValidityPeriod(new Date('2025-11-01'), new Date('2025-12-31')),
        new Date(),
        new Date(),
      );

      mockCouponRepository.existsUserCouponByCouponIdAndUserId.mockResolvedValue(false);
      mockCouponRepository.findCouponByIdWithLockOrElseThrow.mockResolvedValue(coupon);
      mockCouponRepository.saveCoupon.mockResolvedValue();
      mockCouponRepository.saveUserCoupon.mockResolvedValue();

      // when
      await couponService.issueCoupon(couponId, userId, issuedAt);

      // then
      expect(coupon.getQuantity().getIssuedQuantity()).toBe(51); // 51개로 증가
    });
  });

  describe('예외 케이스', () => {
    it('이미 발급받은 쿠폰을 다시 발급받으려 하면 BadRequestException이 발생한다', async () => {
      // given
      mockCouponRepository.existsUserCouponByCouponIdAndUserId.mockResolvedValue(true);

      // when & then
      await expect(couponService.issueCoupon(couponId, userId, issuedAt)).rejects.toThrow(
        new BadRequestException('이미 발급받은 쿠폰입니다.'),
      );
    });

    it('발급 수량이 모두 소진된 쿠폰은 발급할 수 없다', async () => {
      // given
      const coupon = new Coupon(
        couponId,
        '10% 할인 쿠폰',
        new DiscountValue(DiscountType.PERCENTAGE, 10),
        new Point(5000),
        new Point(10000),
        new CouponQuantity(100, 100), // 모두 발급됨
        new ValidityPeriod(new Date('2025-11-01'), new Date('2025-12-31')),
        new Date(),
        new Date(),
      );

      mockCouponRepository.existsUserCouponByCouponIdAndUserId.mockResolvedValue(false);
      mockCouponRepository.findCouponByIdWithLockOrElseThrow.mockResolvedValue(coupon);

      // when & then
      await expect(couponService.issueCoupon(couponId, userId, issuedAt)).rejects.toThrow(
        new BadRequestException('쿠폰을 발급할 수 없습니다.'),
      );
    });

    it('유효기간이 지난 쿠폰은 발급할 수 없다', async () => {
      // given
      const coupon = new Coupon(
        couponId,
        '10% 할인 쿠폰',
        new DiscountValue(DiscountType.PERCENTAGE, 10),
        new Point(5000),
        new Point(10000),
        new CouponQuantity(100, 50),
        new ValidityPeriod(new Date('2025-10-01'), new Date('2025-10-31')), // 이미 지난 기간
        new Date(),
        new Date(),
      );

      mockCouponRepository.existsUserCouponByCouponIdAndUserId.mockResolvedValue(false);
      mockCouponRepository.findCouponByIdWithLockOrElseThrow.mockResolvedValue(coupon);

      // when & then
      await expect(couponService.issueCoupon(couponId, userId, issuedAt)).rejects.toThrow(
        new BadRequestException('쿠폰을 발급할 수 없습니다.'),
      );
    });

    it('유효기간이 시작되지 않은 쿠폰은 발급할 수 없다', async () => {
      // given
      const coupon = new Coupon(
        couponId,
        '10% 할인 쿠폰',
        new DiscountValue(DiscountType.PERCENTAGE, 10),
        new Point(5000),
        new Point(10000),
        new CouponQuantity(100, 50),
        new ValidityPeriod(new Date('2025-12-01'), new Date('2025-12-31')), // 아직 시작 안 됨
        new Date(),
        new Date(),
      );

      mockCouponRepository.existsUserCouponByCouponIdAndUserId.mockResolvedValue(false);
      mockCouponRepository.findCouponByIdWithLockOrElseThrow.mockResolvedValue(coupon);

      // when & then
      await expect(couponService.issueCoupon(couponId, userId, issuedAt)).rejects.toThrow(
        new BadRequestException('쿠폰을 발급할 수 없습니다.'),
      );
    });
  });
});
