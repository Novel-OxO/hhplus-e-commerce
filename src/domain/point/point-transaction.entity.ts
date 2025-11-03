import { Point } from './point.vo';
import { TransactionType } from './transaction-type.vo';

export class PointTransaction {
  constructor(
    private readonly transactionId: string,
    private readonly userId: string,
    private readonly transactionType: TransactionType,
    private readonly amount: Point,
    private readonly balanceAfter: Point,
    private readonly referenceId: string,
    private readonly createdAt: Date,
  ) {}

  static create(
    transactionId: string,
    userId: string,
    transactionType: TransactionType,
    amount: Point,
    balanceAfter: Point,
    referenceId: string,
  ): PointTransaction {
    return new PointTransaction(transactionId, userId, transactionType, amount, balanceAfter, referenceId, new Date());
  }

  getTransactionId(): string {
    return this.transactionId;
  }

  getUserId(): string {
    return this.userId;
  }

  getTransactionType(): TransactionType {
    return this.transactionType;
  }

  getAmount(): Point {
    return this.amount;
  }

  getBalanceAfter(): Point {
    return this.balanceAfter;
  }

  getReferenceId(): string {
    return this.referenceId;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
