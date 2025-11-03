import { Injectable } from '@nestjs/common';
import { ChargeStatus } from '@/domain/point/charge-status.vo';
import { PointBalance } from '@/domain/point/point-balance.entity';
import { PointChargeRequest } from '@/domain/point/point-charge-request.entity';
import { PointTransaction } from '@/domain/point/point-transaction.entity';
import { PointRepository } from '@/domain/point/point.repository';
import { Point } from '@/domain/point/point.vo';
import { NotFoundException } from '@/common/exceptions';

@Injectable()
export class PointMemoryRepository implements PointRepository {
  private readonly balances = new Map<string, PointBalance>();
  private readonly chargeRequests = new Map<string, PointChargeRequest>();
  private readonly transactions = new Map<string, PointTransaction>();

  findBalanceByUserId(userId: string): Promise<PointBalance | null> {
    let balance = this.balances.get(userId);

    if (!balance) {
      balance = new PointBalance(userId, new Point(0));
      this.balances.set(userId, balance);
    }

    return Promise.resolve(balance);
  }

  saveBalance(balance: PointBalance): Promise<PointBalance> {
    this.balances.set(balance.getUserId(), balance);
    return Promise.resolve(balance);
  }

  saveChargeRequest(chargeRequest: PointChargeRequest): Promise<PointChargeRequest> {
    this.chargeRequests.set(chargeRequest.getChargeRequestId(), chargeRequest);
    return Promise.resolve(chargeRequest);
  }

  findChargeRequestById(chargeRequestId: string): Promise<PointChargeRequest | null> {
    const request = this.chargeRequests.get(chargeRequestId) ?? null;
    return Promise.resolve(request);
  }

  createTransaction(transaction: PointTransaction): Promise<PointTransaction> {
    this.transactions.set(transaction.getTransactionId(), transaction);
    return Promise.resolve(transaction);
  }

  updateChargeRequestStatus(chargeRequestId: string, status: ChargeStatus): Promise<PointChargeRequest> {
    const request = this.chargeRequests.get(chargeRequestId);

    if (!request) {
      throw new NotFoundException('충전 요청을 찾을 수 없습니다.');
    }

    if (status === ChargeStatus.COMPLETED) {
      request.complete();
    } else if (status === ChargeStatus.FAILED) {
      request.fail();
    }

    this.chargeRequests.set(chargeRequestId, request);
    return Promise.resolve(request);
  }
}
