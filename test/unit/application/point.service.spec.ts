/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from '@/application/point/point.service';
import { BadRequestException } from '@/common/exceptions';
import { PaymentStatus } from '@/domain/payment/payment-status.vo';
import { PG_CLIENT, type PGClient } from '@/domain/payment/pg-client.interface';
import { PGPaymentInfo } from '@/domain/payment/pg-payment-info.vo';
import { ChargeResult } from '@/domain/point/charge-result.vo';
import { ChargeStatus } from '@/domain/point/charge-status.vo';
import { PointBalance } from '@/domain/point/point-balance.entity';
import { PointChargeRequest } from '@/domain/point/point-charge-request.entity';
import { PointTransaction } from '@/domain/point/point-transaction.entity';
import { POINT_REPOSITORY, type PointRepository } from '@/domain/point/point.repository';
import { Point } from '@/domain/point/point.vo';

describe('PointService - verifyAndCompleteCharge', () => {
  let service: PointService;
  let pointRepository: jest.Mocked<PointRepository>;
  let pgClient: jest.Mocked<PGClient>;

  beforeEach(async () => {
    const mockPointRepository: jest.Mocked<PointRepository> = {
      findBalanceByUserId: jest.fn(),
      findBalanceByUserIdOrElseThrow: jest.fn(),
      saveBalance: jest.fn(),
      saveChargeRequest: jest.fn(),
      findChargeRequestById: jest.fn(),
      findChargeRequestByIdOrElseThrow: jest.fn(),
      createTransaction: jest.fn(),
      updateChargeRequestStatus: jest.fn(),
    };

    const mockPGClient: jest.Mocked<PGClient> = {
      getPaymentInfo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        {
          provide: POINT_REPOSITORY,
          useValue: mockPointRepository,
        },
        {
          provide: PG_CLIENT,
          useValue: mockPGClient,
        },
      ],
    }).compile();

    service = module.get<PointService>(PointService);
    pointRepository = module.get(POINT_REPOSITORY);
    pgClient = module.get(PG_CLIENT);
  });

  describe('정상 케이스', () => {
    it('충전 요청을 검증하고 포인트를 충전한다', async () => {
      // Given
      const chargeRequestId = 1;
      const userId = 100;
      const chargeAmount = new Point(10000);
      const previousBalance = new Point(5000);
      const newBalance = new Point(15000);
      const paymentId = 'payment_123';

      const chargeRequest = new PointChargeRequest(
        userId,
        chargeAmount,
        new Date(),
        ChargeStatus.PENDING,
        null,
        chargeRequestId,
      );

      const pointBalance = new PointBalance(userId, previousBalance);

      const paymentInfo = new PGPaymentInfo(paymentId, chargeAmount, PaymentStatus.SUCCESS, new Date());

      pointRepository.findChargeRequestByIdOrElseThrow.mockResolvedValue(chargeRequest);
      pointRepository.findBalanceByUserIdOrElseThrow.mockResolvedValue(pointBalance);
      pgClient.getPaymentInfo.mockResolvedValue(paymentInfo);
      pointRepository.saveBalance.mockImplementation((balance) => Promise.resolve(balance));
      pointRepository.createTransaction.mockResolvedValue({} as PointTransaction);
      pointRepository.updateChargeRequestStatus.mockResolvedValue({} as PointChargeRequest);

      // When
      const result = await service.verifyAndCompleteCharge(chargeRequestId, paymentId);

      // Then
      expect(result).toBeInstanceOf(ChargeResult);
      expect(result.getChargeRequestId()).toBe(chargeRequestId);
      expect(result.getUserId()).toBe(userId);
      expect(result.getAmount().getValue()).toBe(chargeAmount.getValue());
      expect(result.getCurrentBalance().getValue()).toBe(newBalance.getValue());
      expect(result.getStatus()).toBe(ChargeStatus.COMPLETED);
    });
  });

  describe('멱등성 처리', () => {
    it('이미 완료된 충전 요청은 기존 결과를 반환한다', async () => {
      // Given
      const chargeRequestId = 1;
      const userId = 100;
      const chargeAmount = new Point(10000);
      const currentBalance = new Point(15000);
      const paymentId = 'payment_123';

      // 이미 완료된 충전 요청
      const completedChargeRequest = new PointChargeRequest(
        userId,
        chargeAmount,
        new Date(),
        ChargeStatus.COMPLETED,
        new Date(),
        chargeRequestId,
      );

      const pointBalance = new PointBalance(userId, currentBalance);

      pointRepository.findChargeRequestByIdOrElseThrow.mockResolvedValue(completedChargeRequest);
      pointRepository.findBalanceByUserIdOrElseThrow.mockResolvedValue(pointBalance);

      // When
      const result = await service.verifyAndCompleteCharge(chargeRequestId, paymentId);

      // Then
      expect(result).toBeInstanceOf(ChargeResult);
      expect(result.getChargeRequestId()).toBe(chargeRequestId);
      expect(result.getUserId()).toBe(userId);
      expect(result.getStatus()).toBe(ChargeStatus.COMPLETED);

      // PG 클라이언트 호출되지 않음
      expect(pgClient.getPaymentInfo).not.toHaveBeenCalled();
      // 포인트 저장 및 트랜잭션 생성되지 않음
      expect(pointRepository.saveBalance).not.toHaveBeenCalled();
      expect(pointRepository.createTransaction).not.toHaveBeenCalled();
      expect(pointRepository.updateChargeRequestStatus).not.toHaveBeenCalled();
    });
  });

  describe('예외 케이스', () => {
    it('PG 결제 금액과 충전 요청 금액이 일치하지 않으면 예외를 던진다', async () => {
      // Given
      const chargeRequestId = 1;
      const userId = 100;
      const chargeAmount = new Point(10000);
      const differentAmount = new Point(20000);
      const paymentId = 'payment_123';

      const chargeRequest = new PointChargeRequest(
        userId,
        chargeAmount,
        new Date(),
        ChargeStatus.PENDING,
        null,
        chargeRequestId,
      );

      // PG 결제 금액이 다름
      const paymentInfo = new PGPaymentInfo(paymentId, differentAmount, PaymentStatus.SUCCESS, new Date());

      pointRepository.findChargeRequestByIdOrElseThrow.mockResolvedValue(chargeRequest);
      pgClient.getPaymentInfo.mockResolvedValue(paymentInfo);

      // When & Then
      await expect(service.verifyAndCompleteCharge(chargeRequestId, paymentId)).rejects.toThrow(BadRequestException);
      await expect(service.verifyAndCompleteCharge(chargeRequestId, paymentId)).rejects.toThrow(
        '충전 요청 금액과 PG 결제 금액이 일치하지 않습니다.',
      );

      // 포인트 저장 및 트랜잭션 생성되지 않음
      expect(pointRepository.saveBalance).not.toHaveBeenCalled();
      expect(pointRepository.createTransaction).not.toHaveBeenCalled();
      expect(pointRepository.updateChargeRequestStatus).not.toHaveBeenCalled();
    });
  });
});
