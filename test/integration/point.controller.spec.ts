import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PaymentStatus } from '@/domain/payment/payment-status.vo';
import { PG_CLIENT } from '@/domain/payment/pg-client.interface';
import { PointsModule } from '@/infrastructure/di/points.module';
import { MockPGClient } from '@/infrastructure/external/mock-pg-client';
import {
  ChargeRequestResponseDto,
  GetBalanceResponseDto,
  VerifyChargeResponseDto,
} from '@/presentation/http/point/dto/point-response.dto';
import { TestAppBuilder } from '@test/common/test-app.builder';
import { TestContainerManager } from '@test/common/test-container.manager';

describe('PointsController (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let mockPGClient: MockPGClient;

  beforeAll(async () => {
    await TestContainerManager.start();
    prisma = TestContainerManager.getPrisma();
    app = await new TestAppBuilder().addModule(PointsModule).build();
    mockPGClient = app.get<MockPGClient>(PG_CLIENT);
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  }, 30000);

  beforeEach(async () => {
    await TestContainerManager.cleanupDatabase();
    mockPGClient.clearPayments();
  });

  describe('POST /points/charge', () => {
    it('포인트 충전 요청을 성공적으로 생성한다', async () => {
      // Given: 사용자 생성
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const userId = Number(user.userId);
      const amount = 10000;

      // When: API 호출
      const response = await request(app.getHttpServer()).post('/points/charge').send({ userId, amount }).expect(201);

      // Then: 응답 검증
      const body: ChargeRequestResponseDto = response.body;
      expect(body.chargeRequestId).toBeDefined();
      expect(body.amount).toBe(amount);
      expect(body.status).toBe('PENDING');
      expect(body.createdAt).toBeDefined();

      // 데이터베이스 검증
      const chargeRequest = await prisma.pointChargeRequest.findUnique({
        where: { chargeRequestId: BigInt(body.chargeRequestId) },
      });

      expect(chargeRequest).toBeDefined();
      expect(chargeRequest?.userId).toBe(BigInt(userId));
      expect(Number(chargeRequest?.amount)).toBe(amount);
      expect(chargeRequest?.status).toBe('PENDING');
    });

    it('최소 충전 금액(1,000원)으로 충전 요청을 생성할 수 있다', async () => {
      // Given: 사용자 생성
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const userId = Number(user.userId);
      const amount = 1000;

      // When: API 호출
      const response = await request(app.getHttpServer()).post('/points/charge').send({ userId, amount }).expect(201);

      // Then: 응답 검증
      const body: ChargeRequestResponseDto = response.body;
      expect(body.amount).toBe(amount);
      expect(body.status).toBe('PENDING');
    });

    it('최대 충전 금액(2,000,000원)으로 충전 요청을 생성할 수 있다', async () => {
      // Given: 사용자 생성
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const userId = Number(user.userId);
      const amount = 2000000;

      // When: API 호출
      const response = await request(app.getHttpServer()).post('/points/charge').send({ userId, amount }).expect(201);

      // Then: 응답 검증
      const body: ChargeRequestResponseDto = response.body;
      expect(body.amount).toBe(amount);
      expect(body.status).toBe('PENDING');
    });

    it('최소 금액 미만으로 충전 요청 시 400 에러를 반환한다', async () => {
      // Given: 사용자 생성
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const userId = Number(user.userId);
      const amount = 999; // 최소 금액 미만

      // When & Then: API 호출 및 에러 검증
      await request(app.getHttpServer()).post('/points/charge').send({ userId, amount }).expect(400);
    });

    it('최대 금액 초과로 충전 요청 시 400 에러를 반환한다', async () => {
      // Given: 사용자 생성
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const userId = Number(user.userId);
      const amount = 2000001; // 최대 금액 초과

      // When & Then: API 호출 및 에러 검증
      await request(app.getHttpServer()).post('/points/charge').send({ userId, amount }).expect(400);
    });
  });

  describe('GET /points/balance', () => {
    it('포인트 잔액을 성공적으로 조회한다', async () => {
      // Given: 사용자 및 포인트 잔액 생성
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const userId = Number(user.userId);
      const balance = 50000;

      await prisma.pointBalance.create({
        data: {
          userId: BigInt(userId),
          balance: balance,
        },
      });

      // When: API 호출
      const response = await request(app.getHttpServer()).get(`/points/balance?userId=${userId}`).expect(200);

      // Then: 응답 검증
      const body: GetBalanceResponseDto = response.body;
      expect(body.userId).toBe(userId);
      expect(body.balance).toBe(balance);
    });

    it('잔액이 0인 경우도 조회할 수 있다', async () => {
      // Given: 사용자 및 포인트 잔액 생성 (잔액 0)
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const userId = Number(user.userId);

      await prisma.pointBalance.create({
        data: {
          userId: BigInt(userId),
          balance: 0,
        },
      });

      // When: API 호출
      const response = await request(app.getHttpServer()).get(`/points/balance?userId=${userId}`).expect(200);

      // Then: 응답 검증
      const body: GetBalanceResponseDto = response.body;
      expect(body.userId).toBe(userId);
      expect(body.balance).toBe(0);
    });

    it('존재하지 않는 사용자 ID로 조회하면 404 에러를 반환한다', async () => {
      // Given: 존재하지 않는 사용자 ID
      const nonExistentUserId = 99999;

      // When & Then: API 호출 및 에러 검증
      await request(app.getHttpServer()).get(`/points/balance?userId=${nonExistentUserId}`).expect(404);
    });
  });

  describe('POST /points/charge/verify', () => {
    it('충전 요청을 성공적으로 검증하고 완료한다', async () => {
      // Given: 사용자, 포인트 잔액, 충전 요청 생성
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const userId = Number(user.userId);
      const previousBalance = 10000;
      const chargeAmount = 50000;
      const paymentId = 'payment_123';

      await prisma.pointBalance.create({
        data: {
          userId: BigInt(userId),
          balance: previousBalance,
        },
      });

      const chargeRequest = await prisma.pointChargeRequest.create({
        data: {
          userId: BigInt(userId),
          amount: chargeAmount,
          status: 'PENDING',
        },
      });

      // MockPGClient에 결제 정보 설정
      mockPGClient.mockPayment(paymentId, chargeAmount, PaymentStatus.SUCCESS);

      // When: API 호출
      const response = await request(app.getHttpServer())
        .post('/points/charge/verify')
        .send({ chargeRequestId: Number(chargeRequest.chargeRequestId), paymentId })
        .expect(201);

      // Then: 응답 검증
      const body: VerifyChargeResponseDto = response.body;
      expect(body.chargeRequestId).toBe(Number(chargeRequest.chargeRequestId));
      expect(body.status).toBe('COMPLETED');
      expect(body.amount).toBe(chargeAmount);
      expect(body.previousBalance).toBe(previousBalance);
      expect(body.currentBalance).toBe(previousBalance + chargeAmount);

      // 데이터베이스 검증
      const updatedBalance = await prisma.pointBalance.findUnique({
        where: { userId: BigInt(userId) },
      });

      expect(updatedBalance).toBeDefined();
      expect(Number(updatedBalance?.balance)).toBe(previousBalance + chargeAmount);

      const updatedChargeRequest = await prisma.pointChargeRequest.findUnique({
        where: { chargeRequestId: chargeRequest.chargeRequestId },
      });

      expect(updatedChargeRequest?.status).toBe('COMPLETED');
      expect(updatedChargeRequest?.completedAt).toBeDefined();

      // 트랜잭션 생성 확인
      const transactions = await prisma.pointTransaction.findMany({
        where: { userId: BigInt(userId) },
      });

      expect(transactions).toHaveLength(1);
      expect(Number(transactions[0].amount)).toBe(chargeAmount);
      expect(Number(transactions[0].balanceAfter)).toBe(previousBalance + chargeAmount);
    });

    it('이미 완료된 충전 요청은 멱등성 처리로 기존 결과를 반환한다', async () => {
      // Given: 사용자, 포인트 잔액, 완료된 충전 요청 생성
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const userId = Number(user.userId);
      const balance = 60000;
      const chargeAmount = 50000;
      const paymentId = 'payment_123';

      await prisma.pointBalance.create({
        data: {
          userId: BigInt(userId),
          balance: balance,
        },
      });

      const chargeRequest = await prisma.pointChargeRequest.create({
        data: {
          userId: BigInt(userId),
          amount: chargeAmount,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // When: API 호출 (이미 완료된 요청)
      const response = await request(app.getHttpServer())
        .post('/points/charge/verify')
        .send({ chargeRequestId: Number(chargeRequest.chargeRequestId), paymentId })
        .expect(201);

      // Then: 응답 검증 (기존 잔액 기준으로 반환)
      const body: VerifyChargeResponseDto = response.body;
      expect(body.chargeRequestId).toBe(Number(chargeRequest.chargeRequestId));
      expect(body.status).toBe('COMPLETED');
      expect(body.amount).toBe(chargeAmount);
      expect(body.currentBalance).toBe(balance);

      // 트랜잭션이 추가로 생성되지 않았는지 확인
      const transactions = await prisma.pointTransaction.findMany({
        where: { userId: BigInt(userId) },
      });

      expect(transactions).toHaveLength(0);
    });

    it('충전 요청 금액과 PG 결제 금액이 일치하지 않으면 400 에러를 반환한다', async () => {
      // Given: 사용자, 포인트 잔액, 충전 요청 생성
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const userId = Number(user.userId);
      const chargeAmount = 50000;
      const differentPaymentAmount = 30000;
      const paymentId = 'payment_123';

      await prisma.pointBalance.create({
        data: {
          userId: BigInt(userId),
          balance: 10000,
        },
      });

      const chargeRequest = await prisma.pointChargeRequest.create({
        data: {
          userId: BigInt(userId),
          amount: chargeAmount,
          status: 'PENDING',
        },
      });

      // MockPGClient에 다른 금액의 결제 정보 설정
      mockPGClient.mockPayment(paymentId, differentPaymentAmount, PaymentStatus.SUCCESS);

      // When & Then: API 호출 및 에러 검증
      await request(app.getHttpServer())
        .post('/points/charge/verify')
        .send({ chargeRequestId: Number(chargeRequest.chargeRequestId), paymentId })
        .expect(400);
    });

    it('존재하지 않는 충전 요청 ID로 검증하면 404 에러를 반환한다', async () => {
      // Given: 존재하지 않는 충전 요청 ID
      const nonExistentChargeRequestId = 99999;
      const paymentId = 'payment_123';

      mockPGClient.mockPayment(paymentId, 10000, PaymentStatus.SUCCESS);

      // When & Then: API 호출 및 에러 검증
      await request(app.getHttpServer())
        .post('/points/charge/verify')
        .send({ chargeRequestId: nonExistentChargeRequestId, paymentId })
        .expect(404);
    });

    it('존재하지 않는 결제 정보로 검증하면 404 에러를 반환한다', async () => {
      // Given: 사용자, 포인트 잔액, 충전 요청 생성
      const user = await prisma.user.create({
        data: {
          name: '테스트 사용자',
          email: 'test@example.com',
        },
      });

      const userId = Number(user.userId);
      const chargeAmount = 50000;
      const nonExistentPaymentId = 'non_existent_payment';

      await prisma.pointBalance.create({
        data: {
          userId: BigInt(userId),
          balance: 10000,
        },
      });

      const chargeRequest = await prisma.pointChargeRequest.create({
        data: {
          userId: BigInt(userId),
          amount: chargeAmount,
          status: 'PENDING',
        },
      });

      // When & Then: API 호출 및 에러 검증
      await request(app.getHttpServer())
        .post('/points/charge/verify')
        .send({ chargeRequestId: Number(chargeRequest.chargeRequestId), paymentId: nonExistentPaymentId })
        .expect(404);
    });
  });
});
