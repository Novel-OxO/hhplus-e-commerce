import { Point } from './point.vo';

export class PointBalance {
  private balance: Point;
  private updatedAt: Date;

  constructor(
    private readonly userId: string,
    balance: Point,
    updatedAt?: Date,
  ) {
    this.balance = balance;
    this.updatedAt = updatedAt ?? new Date();
  }

  charge(amount: Point): void {
    this.balance = this.balance.add(amount);
    this.updatedAt = new Date();
  }

  use(amount: Point): void {
    this.balance = this.balance.subtract(amount);
    this.updatedAt = new Date();
  }

  getUserId(): string {
    return this.userId;
  }

  getBalance(): Point {
    return this.balance;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
