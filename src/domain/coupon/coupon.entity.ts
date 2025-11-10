import { BadRequestException } from '@/common/exceptions';
import { Point } from '@/domain/point/point.vo';
import { CouponQuantity } from './coupon-quantity.vo';
import { DiscountValue } from './discount-value.vo';
import { ValidityPeriod } from './validity-period.vo';

export class Coupon {
  private quantity: CouponQuantity;

  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly discountValue: DiscountValue,
    private readonly maxDiscountAmount: Point | null,
    private readonly minOrderAmount: Point,
    quantity: CouponQuantity,
    private readonly validityPeriod: ValidityPeriod,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {
    this.quantity = quantity;
  }

  canIssue(at: Date): boolean {
    return this.isValidPeriod(at) && this.quantity.canIssue();
  }

  issue(): void {
    const now = new Date();
    if (!this.canIssue(now)) {
      throw new BadRequestException('쿠폰을 발급할 수 없습니다.');
    }

    this.quantity = this.quantity.issue();
  }

  isValidPeriod(at: Date): boolean {
    return this.validityPeriod.isValid(at);
  }

  calculateDiscount(orderAmount: Point): Point {
    const discount = this.discountValue.calculateDiscount(orderAmount);

    if (this.maxDiscountAmount) {
      return discount.min(this.maxDiscountAmount);
    }

    return discount;
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDiscountValue(): DiscountValue {
    return this.discountValue;
  }

  getMaxDiscountAmount(): Point | null {
    return this.maxDiscountAmount;
  }

  getMinOrderAmount(): Point {
    return this.minOrderAmount;
  }

  getQuantity(): CouponQuantity {
    return this.quantity;
  }

  getValidityPeriod(): ValidityPeriod {
    return this.validityPeriod;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
