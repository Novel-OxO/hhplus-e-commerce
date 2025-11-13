import { ChargeStatus } from './charge-status.vo';
import { PointBalance } from './point-balance.entity';
import { PointChargeRequest } from './point-charge-request.entity';
import { Point } from './point.vo';

export class ChargeResult {
  constructor(
    private readonly chargeRequestId: number,
    private readonly userId: number,
    private readonly amount: Point,
    private readonly previousBalance: Point,
    private readonly currentBalance: Point,
    private readonly status: ChargeStatus,
  ) {}

  static createChargeResult(
    chargeRequest: PointChargeRequest,
    userId: number,
    currentBalance: PointBalance,
  ): ChargeResult {
    const chargeAmount = chargeRequest.getAmount();
    const newBalance = currentBalance.getBalance();
    const previousBalance = newBalance.subtract(chargeAmount);

    return new ChargeResult(
      chargeRequest.getChargeRequestId() as number,
      userId,
      chargeAmount,
      previousBalance,
      newBalance,
      ChargeStatus.COMPLETED,
    );
  }

  getChargeRequestId(): number {
    return this.chargeRequestId;
  }

  getUserId(): number {
    return this.userId;
  }

  getAmount(): Point {
    return this.amount;
  }

  getPreviousBalance(): Point {
    return this.previousBalance;
  }

  getCurrentBalance(): Point {
    return this.currentBalance;
  }

  getStatus(): ChargeStatus {
    return this.status;
  }

  isCompleted(): boolean {
    return this.status === ChargeStatus.COMPLETED;
  }
}
