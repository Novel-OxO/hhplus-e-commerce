export class OrderStatus {
  static readonly PENDING = new OrderStatus('PENDING');
  static readonly COMPLETED = new OrderStatus('COMPLETED');
  static readonly CANCELLED = new OrderStatus('CANCELLED');

  private constructor(private readonly value: string) {}

  isPending(): boolean {
    return this.value === 'PENDING';
  }

  isCompleted(): boolean {
    return this.value === 'COMPLETED';
  }

  isCancelled(): boolean {
    return this.value === 'CANCELLED';
  }

  getValue(): string {
    return this.value;
  }

  equals(other: OrderStatus): boolean {
    return this.value === other.value;
  }

  static fromString(value: string): OrderStatus {
    switch (value) {
      case 'PENDING':
        return OrderStatus.PENDING;
      case 'COMPLETED':
        return OrderStatus.COMPLETED;
      case 'CANCELLED':
        return OrderStatus.CANCELLED;
      default:
        throw new Error(`Invalid order status: ${value}`);
    }
  }
}
