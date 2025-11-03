import { Server } from 'http';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CouponQuantity } from '@/domain/coupon/coupon-quantity.vo';
import { Coupon } from '@/domain/coupon/coupon.entity';
import { COUPON_REPOSITORY, CouponRepository } from '@/domain/coupon/coupon.repository';
import { DiscountType } from '@/domain/coupon/discount-type.vo';
import { DiscountValue } from '@/domain/coupon/discount-value.vo';
import { ValidityPeriod } from '@/domain/coupon/validity-period.vo';
import { Point } from '@/domain/point/point.vo';
import { CouponsModule } from '@/infrastructure/di/coupons.module';
import { GetMyCouponsResponseDto } from '@/presentation/http/coupon/dto/get-my-coupons.dto';
import { IssueCouponResponseDto } from '@/presentation/http/coupon/dto/issue-coupon.dto';

describe('CouponsController (Integration)', () => {
  let app: INestApplication<Server>;
  let couponRepository: CouponRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CouponsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    couponRepository = moduleFixture.get<CouponRepository>(COUPON_REPOSITORY);

    // 테스트용 쿠폰 데이터 준비
    await setupTestCoupons();
  });

  afterEach(async () => {
    await app.close();
  });

  const setupTestCoupons = async () => {
    // 정상적으로 발급 가능한 쿠폰
    const validCoupon = new Coupon(
      'coupon-valid',
      '10% 할인 쿠폰',
      new DiscountValue(DiscountType.PERCENTAGE, 10),
      new Point(5000),
      new Point(10000),
      new CouponQuantity(100, 0),
      new ValidityPeriod(new Date('2025-01-01'), new Date('2025-12-31')),
      new Date('2025-01-01'),
    );

    // 수량이 거의 소진된 쿠폰
    const limitedCoupon = new Coupon(
      'coupon-limited',
      '한정 쿠폰',
      new DiscountValue(DiscountType.FIXED, 5000),
      null,
      new Point(20000),
      new CouponQuantity(10, 9),
      new ValidityPeriod(new Date('2025-01-01'), new Date('2025-12-31')),
      new Date('2025-01-01'),
    );

    // 수량이 모두 소진된 쿠폰
    const soldOutCoupon = new Coupon(
      'coupon-soldout',
      '품절 쿠폰',
      new DiscountValue(DiscountType.PERCENTAGE, 20),
      new Point(10000),
      new Point(30000),
      new CouponQuantity(50, 50),
      new ValidityPeriod(new Date('2025-01-01'), new Date('2025-12-31')),
      new Date('2025-01-01'),
    );

    // 만료된 쿠폰
    const expiredCoupon = new Coupon(
      'coupon-expired',
      '만료된 쿠폰',
      new DiscountValue(DiscountType.PERCENTAGE, 15),
      new Point(8000),
      new Point(15000),
      new CouponQuantity(100, 0),
      new ValidityPeriod(new Date('2024-01-01'), new Date('2024-12-31')),
      new Date('2024-01-01'),
    );

    await couponRepository.saveCoupon(validCoupon);
    await couponRepository.saveCoupon(limitedCoupon);
    await couponRepository.saveCoupon(soldOutCoupon);
    await couponRepository.saveCoupon(expiredCoupon);
  };

  describe('POST /coupons/:couponId/issue', () => {
    it('정상적으로 쿠폰을 발급한다', async () => {
      const userId = 'user123';
      const couponId = 'coupon-valid';

      const response = await request(app.getHttpServer())
        .post(`/coupons/${couponId}/issue`)
        .send({ userId })
        .expect(201);

      const data = response.body as IssueCouponResponseDto;
      expect(data).toHaveProperty('userCouponId');
      expect(data).toHaveProperty('couponId', couponId);
      expect(data).toHaveProperty('userId', userId);
      expect(data).toHaveProperty('issuedAt');
      expect(data).toHaveProperty('expiresAt');
      expect(data).toHaveProperty('isUsed', false);
      expect(data).toHaveProperty('message', '쿠폰이 발급되었습니다');
    });

    it('이미 발급받은 쿠폰은 중복 발급할 수 없다', async () => {
      const userId = 'user456';
      const couponId = 'coupon-valid';

      // 첫 번째 발급 - 성공
      await request(app.getHttpServer()).post(`/coupons/${couponId}/issue`).send({ userId }).expect(201);

      // 두 번째 발급 시도 - 실패
      const response = await request(app.getHttpServer())
        .post(`/coupons/${couponId}/issue`)
        .send({ userId })
        .expect(400);

      expect(response.body).toHaveProperty('message', '이미 발급받은 쿠폰입니다.');
    });

    it('존재하지 않는 쿠폰은 발급할 수 없다', async () => {
      const userId = 'user789';
      const nonExistentCouponId = 'coupon-nonexistent';

      const response = await request(app.getHttpServer())
        .post(`/coupons/${nonExistentCouponId}/issue`)
        .send({ userId })
        .expect(404);

      expect(response.body).toHaveProperty('message', '쿠폰을 찾을 수 없습니다.');
    });

    it('수량이 모두 소진된 쿠폰은 발급할 수 없다', async () => {
      const userId = 'user999';
      const soldOutCouponId = 'coupon-soldout';

      const response = await request(app.getHttpServer())
        .post(`/coupons/${soldOutCouponId}/issue`)
        .send({ userId })
        .expect(400);

      expect(response.body).toHaveProperty('message', '쿠폰을 발급할 수 없습니다.');
    });

    it('만료된 쿠폰은 발급할 수 없다', async () => {
      const userId = 'user888';
      const expiredCouponId = 'coupon-expired';

      const response = await request(app.getHttpServer())
        .post(`/coupons/${expiredCouponId}/issue`)
        .send({ userId })
        .expect(400);

      expect(response.body).toHaveProperty('message', '쿠폰을 발급할 수 없습니다.');
    });

    it('한정 수량 쿠폰을 마지막 1개까지 발급할 수 있다', async () => {
      const userId = 'user-lucky';
      const limitedCouponId = 'coupon-limited';

      // 마지막 1개 발급 성공
      await request(app.getHttpServer()).post(`/coupons/${limitedCouponId}/issue`).send({ userId }).expect(201);

      // 다음 사용자는 발급 실패
      const nextUserId = 'user-unlucky';
      const response = await request(app.getHttpServer())
        .post(`/coupons/${limitedCouponId}/issue`)
        .send({ userId: nextUserId })
        .expect(400);

      expect(response.body).toHaveProperty('message', '쿠폰을 발급할 수 없습니다.');
    });
  });

  describe('GET /users/me/coupons', () => {
    it('사용자의 쿠폰 목록과 통계를 조회한다', async () => {
      // given: 사용자에게 쿠폰 2개 발급
      const userId = 'user-with-coupons';

      await request(app.getHttpServer()).post('/coupons/coupon-valid/issue').send({ userId }).expect(201);

      await request(app.getHttpServer()).post('/coupons/coupon-limited/issue').send({ userId }).expect(201);

      // when: 쿠폰 목록 조회
      const response = await request(app.getHttpServer()).get('/users/me/coupons').query({ userId }).expect(200);

      // then
      const data = response.body as GetMyCouponsResponseDto;
      expect(data.coupons).toHaveLength(2);
      expect(data.totalCount).toBe(2);
      expect(data.availableCount).toBe(2);
      expect(data.usedCount).toBe(0);
      expect(data.expiredCount).toBe(0);

      // 각 쿠폰 정보 확인
      data.coupons.forEach((coupon) => {
        expect(coupon).toHaveProperty('userCouponId');
        expect(coupon).toHaveProperty('couponId');
        expect(coupon).toHaveProperty('issuedAt');
        expect(coupon).toHaveProperty('expiresAt');
        expect(coupon).toHaveProperty('isUsed', false);
        expect(coupon).toHaveProperty('isExpired', false);
        expect(coupon).toHaveProperty('canUse', true);
      });
    });

    it('쿠폰이 없는 사용자는 빈 목록을 반환한다', async () => {
      const userId = 'user-no-coupons';

      const response = await request(app.getHttpServer()).get('/users/me/coupons').query({ userId }).expect(200);

      const data = response.body as GetMyCouponsResponseDto;
      expect(data.coupons).toHaveLength(0);
      expect(data.totalCount).toBe(0);
      expect(data.availableCount).toBe(0);
      expect(data.usedCount).toBe(0);
      expect(data.expiredCount).toBe(0);
    });

    it('status 파라미터로 사용 가능한 쿠폰만 필터링할 수 있다', async () => {
      // given: 사용자에게 쿠폰 발급
      const userId = 'user-filter-test';

      await request(app.getHttpServer()).post('/coupons/coupon-valid/issue').send({ userId }).expect(201);

      // when: available 상태로 필터링
      const response = await request(app.getHttpServer())
        .get('/users/me/coupons')
        .query({ userId, status: 'available' })
        .expect(200);

      // then
      const data = response.body as GetMyCouponsResponseDto;
      expect(data.coupons.length).toBeGreaterThan(0);
      data.coupons.forEach((coupon) => {
        expect(coupon.canUse).toBe(true);
      });
    });
  });

  describe('GET /users/me/coupons/history', () => {
    it('쿠폰 사용 이력을 페이지네이션과 함께 조회한다', async () => {
      const userId = 'user-history-test';
      const page = 1;
      const limit = 10;

      const response = await request(app.getHttpServer())
        .get('/users/me/coupons/history')
        .query({ userId, page, limit })
        .expect(200);

      expect(response.body).toHaveProperty('history');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('currentPage', page);
      expect(response.body.pagination).toHaveProperty('totalPages');
      expect(response.body.pagination).toHaveProperty('totalCount');
      expect(response.body.pagination).toHaveProperty('limit', limit);
    });

    it('사용 이력이 없으면 빈 배열을 반환한다', async () => {
      const userId = 'user-no-history';

      const response = await request(app.getHttpServer())
        .get('/users/me/coupons/history')
        .query({ userId })
        .expect(200);

      expect(response.body.history).toEqual([]);
      expect(response.body.pagination.totalCount).toBe(0);
    });

    it('페이지네이션 파라미터가 없으면 기본값을 사용한다', async () => {
      const userId = 'user-default-pagination';

      const response = await request(app.getHttpServer())
        .get('/users/me/coupons/history')
        .query({ userId })
        .expect(200);

      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });
  });

  describe('동시성 테스트 샘플(아직 동시성 관련 작업이 안되어있음)', () => {
    it('여러 사용자가 동시에 한정 쿠폰을 발급받으면 정확히 발급 수량만큼만 발급된다', async () => {
      // given: 수량이 1개 남은 쿠폰
      const limitedCouponId = 'coupon-limited';
      const users = ['user-concurrent-1', 'user-concurrent-2', 'user-concurrent-3'];

      // when: 3명의 사용자가 동시에 쿠폰 발급 시도
      const requests = users.map((userId) =>
        request(app.getHttpServer()).post(`/coupons/${limitedCouponId}/issue`).send({ userId }),
      );

      const responses = await Promise.all(requests);

      // then: 1명만 성공, 2명은 실패
      const successCount = responses.filter((r) => r.status === 201).length;
      const failureCount = responses.filter((r) => r.status === 400).length;

      expect(successCount).toBe(1);
      expect(failureCount).toBe(2);
    });
  });
});
