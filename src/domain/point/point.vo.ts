import { BadRequestException } from '@/common/exceptions';

export class Point {
  private static readonly ZERO = 0;

  private readonly value: number;

  constructor(value: number) {
    if (!Number.isInteger(value)) {
      throw new BadRequestException('포인트는 정수여야 합니다.');
    }

    if (value < Point.ZERO) {
      throw new BadRequestException('포인트는 0 이상이어야 합니다.');
    }

    this.value = value;
  }

  add(other: Point): Point {
    return new Point(this.value + other.value);
  }

  subtract(other: Point): Point {
    const result = this.value - other.value;

    if (result < Point.ZERO) {
      throw new BadRequestException('포인트가 부족합니다.');
    }

    return new Point(result);
  }

  getValue(): number {
    return this.value;
  }

  isBetween(min: number, max: number): boolean {
    return this.value >= min && this.value <= max;
  }

  multiply(ratio: number): Point {
    if (ratio < 0) {
      throw new BadRequestException('비율은 0 이상이어야 합니다.');
    }

    return new Point(Math.floor(this.value * ratio));
  }

  min(other: Point): Point {
    return this.value <= other.value ? this : other;
  }

  isGreaterThanOrEqual(other: Point): boolean {
    return this.value >= other.value;
  }

  equals(other: Point): boolean {
    return this.value === other.value;
  }

  validateAmount(expectedAmount: number): void {
    if (this.value !== expectedAmount) {
      throw new BadRequestException(`금액이 일치하지 않습니다. 예상: ${expectedAmount}, 실제: ${this.value}`);
    }
  }
}
