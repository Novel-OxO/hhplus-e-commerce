import { TransactionType } from './transaction-type.vo';

export class PointTransaction {
  constructor(
    private readonly userId: number,
    private readonly transactionType: TransactionType,
    private readonly amount: number,
    private readonly balanceAfter: number,
    private readonly createdAt: Date = new Date(),
    private readonly transactionId?: string,
  ) {}

  static create(
    userId: number,
    transactionType: TransactionType,
    amount: number,
    balanceAfter: number,
  ): PointTransaction {
    return new PointTransaction(userId, transactionType, amount, balanceAfter);
  }

  static use(userId: number, amount: number, balanceAfter: number): PointTransaction {
    return new PointTransaction(userId, TransactionType.USE, amount, balanceAfter);
  }

  getTransactionId(): string | undefined {
    return this.transactionId;
  }

  getUserId(): number {
    return this.userId;
  }

  getTransactionType(): TransactionType {
    return this.transactionType;
  }

  getAmount(): number {
    return this.amount;
  }

  getBalanceAfter(): number {
    return this.balanceAfter;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}
