import { ChargeStatus } from './charge-status.vo';
import { PointBalance } from './point-balance.entity';
import { PointChargeRequest } from './point-charge-request.entity';
import { PointTransaction } from './point-transaction.entity';

export const POINT_REPOSITORY = Symbol('PointRepository');

export interface PointRepository {
  findBalanceByUserId(userId: string): Promise<PointBalance | null>;

  saveBalance(balance: PointBalance): Promise<PointBalance>;

  saveChargeRequest(chargeRequest: PointChargeRequest): Promise<PointChargeRequest>;

  findChargeRequestById(chargeRequestId: string): Promise<PointChargeRequest | null>;

  createTransaction(transaction: PointTransaction): Promise<PointTransaction>;

  updateChargeRequestStatus(chargeRequestId: string, status: ChargeStatus): Promise<PointChargeRequest>;
}
