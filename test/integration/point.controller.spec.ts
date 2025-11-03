import { Server } from 'http';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PointsModule } from '@/infrastructure/di/points.module';
import {
  ChargeRequestResponseDto,
  GetBalanceResponseDto,
  VerifyChargeResponseDto,
} from '@/presentation/http/point/dto/point-response.dto';
import { PaymentStatus } from '@/domain/payment/payment-status.vo';
import { PG_CLIENT } from '@/domain/payment/pg-client.interface';
import { MockPGClient } from '@/infrastructure/external/mock-pg-client';

describe('PointsController (Integration)', () => {
  let app: INestApplication<Server>;
  let mockPGClient: MockPGClient;
  // https://github.com/nestjs/nest/issues/13191 supertest nestjs type 이슈
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PointsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    mockPGClient = moduleFixture.get<MockPGClient>(PG_CLIENT);
  });

  afterEach(async () => {
    mockPGClient.clearPayments();
    await app.close();
  });

  describe('GET /points/balance', () => {
    it('새로운 사용자의 포인트 잔액을 조회하면 0원으로 초기화되어 반환된다', async () => {
      const userId = 'newUser123';

      const response = await request(app.getHttpServer()).get('/points/balance').query({ userId }).expect(200);

      expect(response.body).toHaveProperty('userId', userId);
      expect(response.body).toHaveProperty('balance', 0);
    });
  });

  describe('POST /points/charge', () => {
    it('정상적으로 충전 요청을 생성한다', async () => {
      const userId = 'user123';
      const amount = 50000;

      const response = await request(app.getHttpServer()).post('/points/charge').send({ userId, amount }).expect(201);

      expect(response.body).toHaveProperty('chargeRequestId');
      expect(response.body).toHaveProperty('amount', amount);
      expect(response.body).toHaveProperty('status', 'PENDING');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('충전 금액이 최소값(1,000원) 미만이면 400 에러를 반환한다', async () => {
      const userId = 'user123';
      const amount = 500;

      const response = await request(app.getHttpServer()).post('/points/charge').send({ userId, amount }).expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('충전 금액이 최대값(2,000,000원) 초과하면 400 에러를 반환한다', async () => {
      const userId = 'user123';
      const amount = 3000000;

      const response = await request(app.getHttpServer()).post('/points/charge').send({ userId, amount }).expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('충전 금액이 정수가 아니면 400 에러를 반환한다', async () => {
      const userId = 'user123';
      const amount = 50000.5;

      const response = await request(app.getHttpServer()).post('/points/charge').send({ userId, amount }).expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('충전 금액이 음수이면 400 에러를 반환한다', async () => {
      const userId = 'user123';
      const amount = -1000;

      const response = await request(app.getHttpServer()).post('/points/charge').send({ userId, amount }).expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('최소 충전 금액(1,000원)으로 충전 요청을 생성한다', async () => {
      const userId = 'user123';
      const amount = 1000;

      const response = await request(app.getHttpServer()).post('/points/charge').send({ userId, amount }).expect(201);

      expect(response.body).toHaveProperty('amount', amount);
      expect(response.body).toHaveProperty('status', 'PENDING');
    });

    it('최대 충전 금액(2,000,000원)으로 충전 요청을 생성한다', async () => {
      const userId = 'user123';
      const amount = 2000000;

      const response = await request(app.getHttpServer()).post('/points/charge').send({ userId, amount }).expect(201);

      expect(response.body).toHaveProperty('amount', amount);
      expect(response.body).toHaveProperty('status', 'PENDING');
    });
  });

  describe('POST /points/charge/verify', () => {
    it('정상적으로 충전을 검증하고 완료한다', async () => {
      // given: 충전 요청 생성
      const userId = 'user123';
      const chargeAmount = 50000;

      const chargeResponse = await request(app.getHttpServer())
        .post('/points/charge')
        .send({ userId, amount: chargeAmount })
        .expect(201);

      const chargeData = chargeResponse.body as ChargeRequestResponseDto;
      const chargeRequestId = chargeData.chargeRequestId;

      // Mock PG 결제 정보 설정
      const paymentId = 'payment123';
      mockPGClient.mockPayment(paymentId, chargeAmount, PaymentStatus.SUCCESS);

      // when: 충전 검증
      const verifyResponse = await request(app.getHttpServer())
        .post('/points/charge/verify')
        .send({ chargeRequestId, paymentId })
        .expect(201);

      // then
      const verifyData = verifyResponse.body as VerifyChargeResponseDto;
      expect(verifyData).toHaveProperty('chargeRequestId', chargeRequestId);
      expect(verifyData).toHaveProperty('status', 'COMPLETED');
      expect(verifyData).toHaveProperty('amount', chargeAmount);
      expect(verifyData).toHaveProperty('previousBalance', 0);
      expect(verifyData).toHaveProperty('currentBalance', chargeAmount);

      // 잔액 확인
      const balanceResponse = await request(app.getHttpServer()).get('/points/balance').query({ userId }).expect(200);

      const balanceData = balanceResponse.body as GetBalanceResponseDto;
      expect(balanceData.balance).toBe(chargeAmount);
    });

    it('충전 요청이 존재하지 않으면 404 에러를 반환한다', async () => {
      // given
      const nonexistentChargeRequestId = 'nonexistent';
      const paymentId = 'payment123';

      mockPGClient.mockPayment(paymentId, 50000, PaymentStatus.SUCCESS);

      // when & then
      await request(app.getHttpServer())
        .post('/points/charge/verify')
        .send({ chargeRequestId: nonexistentChargeRequestId, paymentId })
        .expect(404);
    });

    it('PG 결제 정보가 존재하지 않으면 404 에러를 반환한다', async () => {
      // given: 충전 요청 생성
      const userId = 'user123';
      const chargeAmount = 50000;

      const chargeResponse = await request(app.getHttpServer())
        .post('/points/charge')
        .send({ userId, amount: chargeAmount })
        .expect(201);

      const chargeData = chargeResponse.body as ChargeRequestResponseDto;
      const chargeRequestId = chargeData.chargeRequestId;
      const nonexistentPaymentId = 'nonexistent';

      // when & then
      await request(app.getHttpServer())
        .post('/points/charge/verify')
        .send({ chargeRequestId, paymentId: nonexistentPaymentId })
        .expect(404);
    });

    it('충전 요청 금액과 PG 결제 금액이 다르면 400 에러를 반환한다', async () => {
      // given: 충전 요청 생성
      const userId = 'user123';
      const chargeAmount = 50000;

      const chargeResponse = await request(app.getHttpServer())
        .post('/points/charge')
        .send({ userId, amount: chargeAmount })
        .expect(201);

      const chargeData = chargeResponse.body as ChargeRequestResponseDto;
      const chargeRequestId = chargeData.chargeRequestId;

      // Mock PG 결제 정보 - 다른 금액으로 설정
      const paymentId = 'payment123';
      const differentAmount = 30000;
      mockPGClient.mockPayment(paymentId, differentAmount, PaymentStatus.SUCCESS);

      // when & then
      await request(app.getHttpServer()).post('/points/charge/verify').send({ chargeRequestId, paymentId }).expect(400);
    });

    it('이미 완료된 충전 요청은 멱등성을 보장하며 동일한 결과를 반환한다', async () => {
      // given: 충전 요청 생성
      const userId = 'user456';
      const chargeAmount = 100000;

      const chargeResponse = await request(app.getHttpServer())
        .post('/points/charge')
        .send({ userId, amount: chargeAmount })
        .expect(201);

      const chargeData = chargeResponse.body as ChargeRequestResponseDto;
      const chargeRequestId = chargeData.chargeRequestId;

      // Mock PG 결제 정보 설정
      const paymentId = 'payment456';
      mockPGClient.mockPayment(paymentId, chargeAmount, PaymentStatus.SUCCESS);

      // when: 첫 번째 충전 검증
      const firstVerifyResponse = await request(app.getHttpServer())
        .post('/points/charge/verify')
        .send({ chargeRequestId, paymentId })
        .expect(201);

      const firstVerifyData = firstVerifyResponse.body as VerifyChargeResponseDto;
      expect(firstVerifyData.status).toBe('COMPLETED');
      expect(firstVerifyData.currentBalance).toBe(chargeAmount);

      // 두 번째 충전 검증 (멱등성 테스트)
      const secondVerifyResponse = await request(app.getHttpServer())
        .post('/points/charge/verify')
        .send({ chargeRequestId, paymentId })
        .expect(201);

      // then: 동일한 결과 반환
      const secondVerifyData = secondVerifyResponse.body as VerifyChargeResponseDto;
      expect(secondVerifyData).toEqual(firstVerifyData);

      // 잔액이 중복 충전되지 않았는지 확인
      const balanceResponse = await request(app.getHttpServer()).get('/points/balance').query({ userId }).expect(200);

      const balanceData = balanceResponse.body as GetBalanceResponseDto;
      expect(balanceData.balance).toBe(chargeAmount); // 중복 충전 없이 원래 금액 유지
    });

    it('여러 번 충전하면 잔액이 누적된다', async () => {
      // given
      const userId = 'user789';
      const firstChargeAmount = 50000;
      const secondChargeAmount = 30000;

      // 첫 번째 충전
      const firstChargeResponse = await request(app.getHttpServer())
        .post('/points/charge')
        .send({ userId, amount: firstChargeAmount })
        .expect(201);

      const firstChargeData = firstChargeResponse.body as ChargeRequestResponseDto;
      const firstChargeRequestId = firstChargeData.chargeRequestId;
      const firstPaymentId = 'payment789-1';
      mockPGClient.mockPayment(firstPaymentId, firstChargeAmount, PaymentStatus.SUCCESS);

      await request(app.getHttpServer())
        .post('/points/charge/verify')
        .send({ chargeRequestId: firstChargeRequestId, paymentId: firstPaymentId })
        .expect(201);

      // 두 번째 충전
      const secondChargeResponse = await request(app.getHttpServer())
        .post('/points/charge')
        .send({ userId, amount: secondChargeAmount })
        .expect(201);

      const secondChargeData = secondChargeResponse.body as ChargeRequestResponseDto;
      const secondChargeRequestId = secondChargeData.chargeRequestId;
      const secondPaymentId = 'payment789-2';
      mockPGClient.mockPayment(secondPaymentId, secondChargeAmount, PaymentStatus.SUCCESS);

      const secondVerifyResponse = await request(app.getHttpServer())
        .post('/points/charge/verify')
        .send({ chargeRequestId: secondChargeRequestId, paymentId: secondPaymentId })
        .expect(201);

      // then
      const secondVerifyData = secondVerifyResponse.body as VerifyChargeResponseDto;
      expect(secondVerifyData.previousBalance).toBe(firstChargeAmount);
      expect(secondVerifyData.currentBalance).toBe(firstChargeAmount + secondChargeAmount);

      // 최종 잔액 확인
      const balanceResponse = await request(app.getHttpServer()).get('/points/balance').query({ userId }).expect(200);

      const balanceData = balanceResponse.body as GetBalanceResponseDto;
      expect(balanceData.balance).toBe(firstChargeAmount + secondChargeAmount);
    });
  });
});
