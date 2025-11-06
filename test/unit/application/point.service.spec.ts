import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from '@/application/point.service';
import { UserMutexService } from '@/application/user-mutex.service';
import { BadRequestException, NotFoundException } from '@/common/exceptions';
import { PaymentStatus } from '@/domain/payment/payment-status.vo';
import { PG_CLIENT, type PGClient } from '@/domain/payment/pg-client.interface';
import { PGPaymentInfo } from '@/domain/payment/pg-payment-info.vo';
import { ChargeStatus } from '@/domain/point/charge-status.vo';
import { PointBalance } from '@/domain/point/point-balance.entity';
import { PointChargeRequest } from '@/domain/point/point-charge-request.entity';
import { PointTransaction } from '@/domain/point/point-transaction.entity';
import { POINT_REPOSITORY, type PointRepository } from '@/domain/point/point.repository';
import { Point } from '@/domain/point/point.vo';
import { TransactionType } from '@/domain/point/transaction-type.vo';
import { ID_GENERATOR, type IdGenerator } from '@/infrastructure/id-generator/id-generator.interface';

describe('PointService', () => {
  let service: PointService;
  let repository: jest.Mocked<PointRepository>;
  let idGenerator: jest.Mocked<IdGenerator>;
  let pgClient: jest.Mocked<PGClient>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<PointRepository> = {
      findBalanceByUserId: jest.fn(),
      saveBalance: jest.fn(),
      saveChargeRequest: jest.fn(),
      findChargeRequestById: jest.fn(),
      createTransaction: jest.fn(),
      updateChargeRequestStatus: jest.fn(),
    };

    const mockIdGenerator: jest.Mocked<IdGenerator> = {
      generate: jest.fn(),
    };

    const mockPgClient: jest.Mocked<PGClient> = {
      getPaymentInfo: jest.fn(),
    };

    const mockUserMutexService = {
      withUserLock: jest.fn((userId: string, fn: () => Promise<any>) => fn()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        {
          provide: POINT_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: ID_GENERATOR,
          useValue: mockIdGenerator,
        },
        {
          provide: PG_CLIENT,
          useValue: mockPgClient,
        },
        {
          provide: UserMutexService,
          useValue: mockUserMutexService,
        },
      ],
    }).compile();

    service = module.get<PointService>(PointService);
    repository = module.get(POINT_REPOSITORY);
    idGenerator = module.get(ID_GENERATOR);
    pgClient = module.get(PG_CLIENT);
  });

  describe('getBalance', () => {
    it('사용자의 포인트 잔액을 반환한다', async () => {
      const userId = 'user123';
      const expectedBalance = new PointBalance(userId, new Point(50000));

      repository.findBalanceByUserId.mockResolvedValue(expectedBalance);

      const result = await service.getBalance(userId);

      expect(result).toBe(expectedBalance);
    });

    it('포인트 잔액이 없으면 예외를 발생시킨다', async () => {
      const userId = 'user456';

      repository.findBalanceByUserId.mockResolvedValue(null);

      await expect(service.getBalance(userId)).rejects.toThrow(BadRequestException);
      await expect(service.getBalance(userId)).rejects.toThrow(`${userId}의 포인트 잔액을 찾을 수 없습니다.`);
    });
  });

  describe('createChargeRequest', () => {
    it('정상적으로 충전 요청을 생성한다', async () => {
      // given
      const userId = 'user123';
      const amount = new Point(50000);
      const generatedId = '1234567890123456789';

      idGenerator.generate.mockReturnValue(generatedId);

      const expectedChargeRequest = PointChargeRequest.create(generatedId, userId, amount);
      repository.saveChargeRequest.mockResolvedValue(expectedChargeRequest);

      // when
      const result = await service.createChargeRequest(userId, amount);

      // then
      expect(result.getUserId()).toBe(userId);
      expect(result.getAmount().getValue()).toBe(50000);
      expect(result.getStatus()).toBe(ChargeStatus.PENDING);
    });

    // 경계값 테스트
    it.each([
      { amount: 1000, description: '최소 충전 금액(1,000원)' },
      { amount: 2000000, description: '최대 충전 금액(2,000,000원)' },
    ])('$description으로 충전 요청을 생성한다', async ({ amount }) => {
      // given
      const userId = 'user123';
      const point = new Point(amount);
      const generatedId = '1234567890123456789';

      idGenerator.generate.mockReturnValue(generatedId);

      const expectedChargeRequest = PointChargeRequest.create(generatedId, userId, point);
      repository.saveChargeRequest.mockResolvedValue(expectedChargeRequest);

      // when
      const result = await service.createChargeRequest(userId, point);

      // then
      expect(result.getAmount().getValue()).toBe(amount);
      expect(result.getStatus()).toBe(ChargeStatus.PENDING);
    });

    // 예외 테스트
    it.each([
      { amount: 500, description: '최소값(1,000원) 미만' },
      { amount: 3000000, description: '최대값(2,000,000원) 초과' },
      { amount: 50000.5, description: '정수가 아님' },
      { amount: -1000, description: '음수' },
    ])('금액이 $description이면 예외를 발생시킨다', async ({ amount }) => {
      // given
      const userId = 'user123';

      // when & then
      await expect(async () => {
        const point = new Point(amount);
        await service.createChargeRequest(userId, point);
      }).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyAndCompleteCharge', () => {
    it('정상적으로 충전을 검증하고 완료한다', async () => {
      // given
      const chargeRequestId = 'charge123';
      const paymentId = 'payment123';
      const userId = 'user123';
      const chargeAmount = new Point(50000);
      const previousBalance = new Point(100000);

      const chargeRequest = new PointChargeRequest(
        chargeRequestId,
        userId,
        chargeAmount,
        new Date(),
        ChargeStatus.PENDING,
        null,
      );

      const pointBalance = new PointBalance(userId, previousBalance);

      const paymentInfo = new PGPaymentInfo(paymentId, chargeAmount, PaymentStatus.SUCCESS, new Date());

      const mockTransaction = PointTransaction.create(
        'transaction123',
        userId,
        TransactionType.CHARGE,
        chargeAmount,
        new Point(150000),
        chargeRequestId,
      );

      repository.findChargeRequestById.mockResolvedValue(chargeRequest);
      pgClient.getPaymentInfo.mockResolvedValue(paymentInfo);
      repository.findBalanceByUserId.mockResolvedValue(pointBalance);
      idGenerator.generate.mockReturnValue('transaction123');
      repository.saveBalance.mockResolvedValue(pointBalance);
      repository.createTransaction.mockResolvedValue(mockTransaction);
      repository.updateChargeRequestStatus.mockResolvedValue(chargeRequest);

      // when
      const result = await service.verifyAndCompleteCharge(chargeRequestId, paymentId);

      // then
      expect(result.getChargeRequestId()).toBe(chargeRequestId);
      expect(result.getUserId()).toBe(userId);
      expect(result.getAmount().getValue()).toBe(50000);
      expect(result.getPreviousBalance().getValue()).toBe(100000);
      expect(result.getCurrentBalance().getValue()).toBe(150000);
      expect(result.getStatus()).toBe(ChargeStatus.COMPLETED);
    });

    it('충전 요청이 존재하지 않으면 예외를 발생시킨다', async () => {
      // given
      const chargeRequestId = 'nonexistent';
      const paymentId = 'payment123';

      repository.findChargeRequestById.mockResolvedValue(null);

      // when & then
      await expect(service.verifyAndCompleteCharge(chargeRequestId, paymentId)).rejects.toThrow(NotFoundException);
      await expect(service.verifyAndCompleteCharge(chargeRequestId, paymentId)).rejects.toThrow(
        '충전 요청을 찾을 수 없습니다.',
      );
    });

    it('이미 완료된 충전 요청은 멱등성을 보장하며 현재 잔액을 반환한다', async () => {
      // given
      const chargeRequestId = 'charge123';
      const paymentId = 'payment123';
      const userId = 'user123';
      const chargeAmount = new Point(50000);
      const currentBalance = new Point(150000);

      const completedChargeRequest = new PointChargeRequest(
        chargeRequestId,
        userId,
        chargeAmount,
        new Date(),
        ChargeStatus.COMPLETED,
        new Date(),
      );

      const pointBalance = new PointBalance(userId, currentBalance);

      repository.findChargeRequestById.mockResolvedValue(completedChargeRequest);
      repository.findBalanceByUserId.mockResolvedValue(pointBalance);

      const pgClientSpy = jest.spyOn(pgClient, 'getPaymentInfo');
      const saveBalanceSpy = jest.spyOn(repository, 'saveBalance');
      const createTransactionSpy = jest.spyOn(repository, 'createTransaction');
      const updateStatusSpy = jest.spyOn(repository, 'updateChargeRequestStatus');

      // when
      const result = await service.verifyAndCompleteCharge(chargeRequestId, paymentId);

      // then
      expect(result.getChargeRequestId()).toBe(chargeRequestId);
      expect(result.getUserId()).toBe(userId);
      expect(result.getAmount().getValue()).toBe(50000);
      expect(result.getPreviousBalance().getValue()).toBe(100000);
      expect(result.getCurrentBalance().getValue()).toBe(150000);
      expect(result.getStatus()).toBe(ChargeStatus.COMPLETED);

      // 멱등성 처리로 PG 호출 및 데이터 수정이 일어나지 않음
      expect(pgClientSpy).not.toHaveBeenCalled();
      expect(saveBalanceSpy).not.toHaveBeenCalled();
      expect(createTransactionSpy).not.toHaveBeenCalled();
      expect(updateStatusSpy).not.toHaveBeenCalled();
    });

    it('충전 요청 금액과 PG 결제 금액이 다르면 예외를 발생시킨다', async () => {
      // given
      const chargeRequestId = 'charge123';
      const paymentId = 'payment123';
      const userId = 'user123';
      const chargeAmount = new Point(50000);
      const paymentAmount = new Point(30000); // 금액 불일치

      const chargeRequest = new PointChargeRequest(
        chargeRequestId,
        userId,
        chargeAmount,
        new Date(),
        ChargeStatus.PENDING,
        null,
      );

      const paymentInfo = new PGPaymentInfo(paymentId, paymentAmount, PaymentStatus.SUCCESS, new Date());

      repository.findChargeRequestById.mockResolvedValue(chargeRequest);
      pgClient.getPaymentInfo.mockResolvedValue(paymentInfo);

      // when & then
      await expect(service.verifyAndCompleteCharge(chargeRequestId, paymentId)).rejects.toThrow(BadRequestException);
      await expect(service.verifyAndCompleteCharge(chargeRequestId, paymentId)).rejects.toThrow(
        '충전 요청 금액과 PG 결제 금액이 일치하지 않습니다.',
      );
    });

    it('포인트 잔액을 찾을 수 없으면 예외를 발생시킨다', async () => {
      // given
      const chargeRequestId = 'charge123';
      const paymentId = 'payment123';
      const userId = 'user123';
      const chargeAmount = new Point(50000);

      const chargeRequest = new PointChargeRequest(
        chargeRequestId,
        userId,
        chargeAmount,
        new Date(),
        ChargeStatus.PENDING,
        null,
      );

      const paymentInfo = new PGPaymentInfo(paymentId, chargeAmount, PaymentStatus.SUCCESS, new Date());

      repository.findChargeRequestById.mockResolvedValue(chargeRequest);
      pgClient.getPaymentInfo.mockResolvedValue(paymentInfo);
      repository.findBalanceByUserId.mockResolvedValue(null);

      // when & then
      await expect(service.verifyAndCompleteCharge(chargeRequestId, paymentId)).rejects.toThrow(NotFoundException);
      await expect(service.verifyAndCompleteCharge(chargeRequestId, paymentId)).rejects.toThrow(
        '포인트 잔액을 찾을 수 없습니다.',
      );
    });
  });
});
