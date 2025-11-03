import { ChargeStatus } from './charge-status.vo';
import { Point } from './point.vo';

export class ChargeResult {
  constructor(
    private readonly chargeRequestId: string,
    private readonly userId: string,
    private readonly amount: Point,
    private readonly previousBalance: Point,
    private readonly currentBalance: Point,
    private readonly status: ChargeStatus,
  ) {}

  getChargeRequestId(): string {
    return this.chargeRequestId;
  }

  getUserId(): string {
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
