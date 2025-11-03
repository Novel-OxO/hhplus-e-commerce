import { Point } from '@/domain/point/point.vo';
import { DiscountType } from './discount-type.vo';
import { BadRequestException } from '@/common/exceptions';

export class DiscountValue {
  private readonly type: DiscountType;
  private readonly value: number;

  constructor(type: DiscountType, value: number) {
    this.validateValue(type, value);
    this.type = type;
    this.value = value;
  }

  private validateValue(type: DiscountType, value: number): void {
    if (type === DiscountType.PERCENTAGE) {
      if (value < 0 || value > 100) {
        throw new BadRequestException('할인율은 0~100 사이여야 합니다.');
      }
    } else if (type === DiscountType.FIXED) {
      if (!Number.isInteger(value)) {
        throw new BadRequestException('할인 금액은 정수여야 합니다.');
      }
      if (value <= 0) {
        throw new BadRequestException('할인 금액은 0보다 커야 합니다.');
      }
    }
  }

  calculateDiscount(orderAmount: Point): Point {
    if (this.type === DiscountType.PERCENTAGE) {
      return orderAmount.multiply(this.value / 100);
    } else {
      return new Point(this.value);
    }
  }

  getType(): DiscountType {
    return this.type;
  }

  getValue(): number {
    return this.value;
  }
}
