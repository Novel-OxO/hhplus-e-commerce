import { BadRequestException } from '@/common/exceptions';
import { Point } from '@/domain/point/point.vo';
import { Coupon } from './coupon.entity';
import { ValidityPeriod } from './validity-period.vo';

export class UserCoupon {
  private usedAt: Date | null;
  private orderId: number | null;

  constructor(
    private readonly userId: number,
    private readonly coupon: Coupon,
    private readonly issuedAt: Date,
    private readonly validityPeriod: ValidityPeriod,
    usedAt: Date | null = null,
    orderId: number | null = null,
    private readonly id?: number,
  ) {
    this.usedAt = usedAt;
    this.orderId = orderId;
  }

  static create(userId: number, coupon: Coupon, validityPeriod: ValidityPeriod, issuedAt: Date = new Date()) {
    return new UserCoupon(userId, coupon, issuedAt, validityPeriod);
  }

  isUsed(): boolean {
    return this.usedAt !== null;
  }

  isExpired(at: Date): boolean {
    return this.validityPeriod.isExpired(at);
  }

  canUse(at: Date, orderAmount: Point, minOrderAmount: Point): boolean {
    if (this.isUsed()) {
      return false;
    }

    if (this.isExpired(at)) {
      return false;
    }

    if (!orderAmount.isGreaterThanOrEqual(minOrderAmount)) {
      return false;
    }

    return true;
  }

  use(orderId: number): void {
    if (this.isUsed()) {
      throw new BadRequestException('이미 사용된 쿠폰입니다.');
    }

    const now = new Date();
    if (this.isExpired(now)) {
      throw new BadRequestException('만료된 쿠폰입니다.');
    }

    this.usedAt = now;
    this.orderId = orderId;
  }

  restore(): void {
    if (!this.isUsed()) {
      throw new BadRequestException('사용되지 않은 쿠폰은 복구할 수 없습니다.');
    }

    const now = new Date();
    if (this.isExpired(now)) {
      throw new BadRequestException('만료된 쿠폰은 복구할 수 없습니다.');
    }

    this.usedAt = null;
    this.orderId = null;
  }

  getId(): number | undefined {
    return this.id;
  }

  getUserId(): number {
    return this.userId;
  }

  getCoupon(): Coupon {
    return this.coupon;
  }

  getIssuedAt(): Date {
    return this.issuedAt;
  }

  getValidityPeriod(): ValidityPeriod {
    return this.validityPeriod;
  }

  getUsedAt(): Date | null {
    return this.usedAt;
  }

  getOrderId(): number | null {
    return this.orderId;
  }
}
