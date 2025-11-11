import { Inject, Injectable } from '@nestjs/common';
import { BadRequestException } from '@/common/exceptions';
import { PG_CLIENT, type PGClient } from '@/domain/payment/pg-client.interface';
import { ChargeResult } from '@/domain/point/charge-result.vo';
import { ChargeStatus } from '@/domain/point/charge-status.vo';
import { PointBalance } from '@/domain/point/point-balance.entity';
import { PointChargeRequest } from '@/domain/point/point-charge-request.entity';
import { PointTransaction } from '@/domain/point/point-transaction.entity';
import { POINT_REPOSITORY, type PointRepository } from '@/domain/point/point.repository';
import { Point } from '@/domain/point/point.vo';
import { TransactionType } from '@/domain/point/transaction-type.vo';

@Injectable()
export class PointService {
  constructor(
    @Inject(POINT_REPOSITORY)
    private readonly pointRepository: PointRepository,
    @Inject(PG_CLIENT)
    private readonly pgClient: PGClient,
  ) {}

  async getBalance(userId: number): Promise<PointBalance> {
    const pointBalance = await this.pointRepository.findBalanceByUserIdOrElseThrow(userId);

    return pointBalance;
  }

  async createChargeRequest(userId: number, amount: Point): Promise<PointChargeRequest> {
    const chargeRequest = PointChargeRequest.create(userId, amount);

    return await this.pointRepository.saveChargeRequest(chargeRequest);
  }

  async verifyAndCompleteCharge(chargeRequestId: number, paymentId: string): Promise<ChargeResult> {
    const chargeRequest = await this.pointRepository.findChargeRequestByIdOrElseThrow(chargeRequestId);
    const userId = chargeRequest.getUserId();

    // 멱등성 처리
    if (chargeRequest.getStatus() === ChargeStatus.COMPLETED) {
      const currentBalance = await this.pointRepository.findBalanceByUserIdOrElseThrow(userId);

      return ChargeResult.createChargeResult(chargeRequest, userId, currentBalance);
    }

    const paymentInfo = await this.pgClient.getPaymentInfo(paymentId);
    if (!paymentInfo.isAmountMatch(chargeRequest.getAmount())) {
      throw new BadRequestException('충전 요청 금액과 PG 결제 금액이 일치하지 않습니다.');
    }

    // 임계 영역: 포인트 잔액 조회 -> 충전 -> 저장
    const pointBalance = await this.pointRepository.findBalanceByUserIdOrElseThrow(userId);

    pointBalance.charge(chargeRequest.getAmount());

    const transaction = PointTransaction.create(
      userId,
      TransactionType.CHARGE,
      chargeRequest.getAmount().getValue(),
      pointBalance.getBalance().getValue(),
    );

    await this.pointRepository.saveBalance(pointBalance);
    await this.pointRepository.createTransaction(transaction);
    await this.pointRepository.updateChargeRequestStatus(chargeRequestId, ChargeStatus.COMPLETED);

    return ChargeResult.createChargeResult(chargeRequest, userId, pointBalance);
  }
}
