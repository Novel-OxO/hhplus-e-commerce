import { Inject, Injectable } from '@nestjs/common';
import { ChargeResult } from '@/domain/point/charge-result.vo';
import { ChargeStatus } from '@/domain/point/charge-status.vo';
import { PointBalance } from '@/domain/point/point-balance.entity';
import { PointChargeRequest } from '@/domain/point/point-charge-request.entity';
import { PointTransaction } from '@/domain/point/point-transaction.entity';
import { POINT_REPOSITORY, type PointRepository } from '@/domain/point/point.repository';
import { Point } from '@/domain/point/point.vo';
import { TransactionType } from '@/domain/point/transaction-type.vo';
import { BadRequestException, NotFoundException } from '@/common/exceptions';
import { PG_CLIENT, type PGClient } from '@/domain/payment/pg-client.interface';
import { ID_GENERATOR, type IdGenerator } from '@/infrastructure/id-generator/id-generator.interface';

@Injectable()
export class PointService {
  constructor(
    @Inject(POINT_REPOSITORY)
    private readonly pointRepository: PointRepository,
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IdGenerator,
    @Inject(PG_CLIENT)
    private readonly pgClient: PGClient,
  ) {}

  async getBalance(userId: string): Promise<PointBalance> {
    const pointBalance = await this.pointRepository.findBalanceByUserId(userId);

    if (!pointBalance) {
      throw new BadRequestException(`${userId}의 포인트 잔액을 찾을 수 없습니다.`);
    }

    return pointBalance;
  }

  async getBalanceValue(userId: string): Promise<number> {
    const pointBalance = await this.pointRepository.findBalanceByUserId(userId);
    return pointBalance?.getBalance().getValue() ?? 0;
  }

  async createChargeRequest(userId: string, amount: Point): Promise<PointChargeRequest> {
    const chargeRequestId = this.idGenerator.generate();
    const chargeRequest = PointChargeRequest.create(chargeRequestId, userId, amount);

    return await this.pointRepository.saveChargeRequest(chargeRequest);
  }

  async verifyAndCompleteCharge(chargeRequestId: string, paymentId: string): Promise<ChargeResult> {
    const chargeRequest = await this.pointRepository.findChargeRequestById(chargeRequestId);

    if (!chargeRequest) {
      throw new NotFoundException('충전 요청을 찾을 수 없습니다.');
    }
    // 멱등성 처리
    if (chargeRequest.getStatus() === ChargeStatus.COMPLETED) {
      const currentBalance = await this.pointRepository.findBalanceByUserId(chargeRequest.getUserId());

      if (!currentBalance) {
        throw new NotFoundException('포인트 잔액을 찾을 수 없습니다.');
      }

      return new ChargeResult(
        chargeRequest.getChargeRequestId(),
        chargeRequest.getUserId(),
        chargeRequest.getAmount(),
        currentBalance.getBalance().subtract(chargeRequest.getAmount()),
        currentBalance.getBalance(),
        ChargeStatus.COMPLETED,
      );
    }

    const paymentInfo = await this.pgClient.getPaymentInfo(paymentId);

    if (!paymentInfo.isAmountMatch(chargeRequest.getAmount())) {
      throw new BadRequestException('충전 요청 금액과 PG 결제 금액이 일치하지 않습니다.');
    }

    // 데이터베이스 레벨 트랜잭션 필요! 임계 영역 처리 되어야 함
    const pointBalance = await this.pointRepository.findBalanceByUserId(chargeRequest.getUserId());

    if (!pointBalance) {
      throw new NotFoundException('포인트 잔액을 찾을 수 없습니다.');
    }

    const previousBalance = pointBalance.getBalance();

    pointBalance.charge(chargeRequest.getAmount());

    const transactionId = this.idGenerator.generate();
    const transaction = PointTransaction.create(
      transactionId,
      chargeRequest.getUserId(),
      TransactionType.CHARGE,
      chargeRequest.getAmount(),
      pointBalance.getBalance(),
      chargeRequestId,
    );

    await this.pointRepository.saveBalance(pointBalance);
    await this.pointRepository.createTransaction(transaction);
    await this.pointRepository.updateChargeRequestStatus(chargeRequestId, ChargeStatus.COMPLETED);
    // 트랜잭션 커밋

    return new ChargeResult(
      chargeRequest.getChargeRequestId(),
      chargeRequest.getUserId(),
      chargeRequest.getAmount(),
      previousBalance,
      pointBalance.getBalance(),
      ChargeStatus.COMPLETED,
    );
  }
}
