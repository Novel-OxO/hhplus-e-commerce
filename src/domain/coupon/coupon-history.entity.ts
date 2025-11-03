import { Point } from '@/domain/point/point.vo';

export class CouponHistory {
  constructor(
    private readonly id: string,
    private readonly userCouponId: string,
    private readonly userId: string,
    private readonly couponId: string,
    private readonly orderId: string,
    private readonly discountAmount: Point,
    private readonly orderAmount: Point,
    private readonly usedAt: Date,
  ) {}

  static create(
    id: string,
    userCouponId: string,
    userId: string,
    couponId: string,
    orderId: string,
    discountAmount: Point,
    orderAmount: Point,
  ): CouponHistory {
    return new CouponHistory(id, userCouponId, userId, couponId, orderId, discountAmount, orderAmount, new Date());
  }

  getId(): string {
    return this.id;
  }

  getUserCouponId(): string {
    return this.userCouponId;
  }

  getUserId(): string {
    return this.userId;
  }

  getCouponId(): string {
    return this.couponId;
  }

  getOrderId(): string {
    return this.orderId;
  }

  getDiscountAmount(): Point {
    return this.discountAmount;
  }

  getOrderAmount(): Point {
    return this.orderAmount;
  }

  getUsedAt(): Date {
    return this.usedAt;
  }
}
