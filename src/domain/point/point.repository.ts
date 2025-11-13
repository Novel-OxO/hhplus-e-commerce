import { ChargeStatus } from './charge-status.vo';
import { PointBalance } from './point-balance.entity';
import { PointChargeRequest } from './point-charge-request.entity';
import { PointTransaction } from './point-transaction.entity';

export const POINT_REPOSITORY = Symbol('PointRepository');

export interface PointRepository {
  findBalanceByUserId(userId: number): Promise<PointBalance | null>;

  findBalanceByUserIdOrElseThrow(userId: number): Promise<PointBalance>;

  saveBalance(balance: PointBalance): Promise<PointBalance>;

  saveChargeRequest(chargeRequest: PointChargeRequest): Promise<PointChargeRequest>;

  findChargeRequestById(chargeRequestId: number): Promise<PointChargeRequest | null>;

  findChargeRequestByIdOrElseThrow(chargeRequestId: number): Promise<PointChargeRequest>;

  createTransaction(transaction: PointTransaction): Promise<PointTransaction>;

  updateChargeRequestStatus(chargeRequestId: number, status: ChargeStatus): Promise<PointChargeRequest>;
}
