import { Point } from '@/domain/point/point.vo';
import { ValidityPeriod } from './validity-period.vo';
import { BadRequestException } from '@/common/exceptions';

export class UserCoupon {
  private usedAt: Date | null;
  private orderId: string | null;

  constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly couponId: string,
    private readonly issuedAt: Date,
    private readonly validityPeriod: ValidityPeriod,
    usedAt: Date | null = null,
    orderId: string | null = null,
  ) {
    this.usedAt = usedAt;
    this.orderId = orderId;
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

  use(orderId: string): void {
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

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getCouponId(): string {
    return this.couponId;
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

  getOrderId(): string | null {
    return this.orderId;
  }
}
