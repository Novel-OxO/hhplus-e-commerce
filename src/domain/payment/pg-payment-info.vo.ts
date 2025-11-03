import { Point } from '@/domain/point/point.vo';
import { PaymentStatus } from './payment-status.vo';

export class PGPaymentInfo {
  constructor(
    private readonly paymentId: string,
    private readonly amount: Point,
    private readonly status: PaymentStatus,
    private readonly paidAt: Date,
  ) {}

  isAmountMatch(expectedAmount: Point): boolean {
    return this.amount.getValue() === expectedAmount.getValue();
  }

  getPaymentId(): string {
    return this.paymentId;
  }

  getAmount(): Point {
    return this.amount;
  }

  getStatus(): PaymentStatus {
    return this.status;
  }

  getPaidAt(): Date {
    return this.paidAt;
  }

  isSuccess(): boolean {
    return this.status === PaymentStatus.SUCCESS;
  }
}
