import { BadRequestException } from '@/common/exceptions';
import { Point } from '@/domain/point/point.vo';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from './order-status.vo';

export class Order {
  private status: OrderStatus;
  private completedAt: Date | null;
  private cancelledAt: Date | null;

  constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly items: OrderItem[],
    private readonly totalPrice: Point,
    private readonly discountPrice: Point,
    private readonly finalPrice: Point,
    private readonly userCouponId: string | null,
    private readonly createdAt: Date,
    status?: OrderStatus,
    completedAt: Date | null = null,
    cancelledAt: Date | null = null,
  ) {
    if (items.length === 0) {
      throw new BadRequestException('주문 항목이 없습니다.');
    }

    this.status = status ?? OrderStatus.PENDING;
    this.completedAt = completedAt;
    this.cancelledAt = cancelledAt;
  }

  validateAmount(expectedAmount: Point): void {
    if (!this.finalPrice.equals(expectedAmount)) {
      throw new BadRequestException(
        `주문 금액이 일치하지 않습니다. 예상: ${expectedAmount.getValue()}, 실제: ${this.finalPrice.getValue()}`,
      );
    }
  }

  complete(): void {
    if (!this.status.isPending()) {
      throw new BadRequestException('대기 중인 주문만 완료할 수 있습니다.');
    }

    this.status = OrderStatus.COMPLETED;
    this.completedAt = new Date();
  }

  cancel(): void {
    if (this.status.isCompleted()) {
      throw new BadRequestException('완료된 주문은 취소할 수 없습니다.');
    }

    if (this.status.isCancelled()) {
      throw new BadRequestException('이미 취소된 주문입니다.');
    }

    this.status = OrderStatus.CANCELLED;
    this.cancelledAt = new Date();
  }

  hasCoupon(): boolean {
    return this.userCouponId !== null;
  }

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getItems(): OrderItem[] {
    return [...this.items];
  }

  getTotalPrice(): Point {
    return this.totalPrice;
  }

  getDiscountPrice(): Point {
    return this.discountPrice;
  }

  getFinalPrice(): Point {
    return this.finalPrice;
  }

  getUserCouponId(): string | null {
    return this.userCouponId;
  }

  getStatus(): OrderStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getCompletedAt(): Date | null {
    return this.completedAt;
  }

  getCancelledAt(): Date | null {
    return this.cancelledAt;
  }
}
