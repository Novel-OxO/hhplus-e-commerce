import { BadRequestException } from '@/common/exceptions';
import { ChargeStatus } from './charge-status.vo';
import { Point } from './point.vo';

export class PointChargeRequest {
  private static readonly MIN_CHARGE = 1_000;
  private static readonly MAX_CHARGE = 2_000_000;

  private status: ChargeStatus;
  private completedAt: Date | null;

  constructor(
    private readonly userId: number,
    private readonly amount: Point,
    private readonly createdAt: Date,
    status?: ChargeStatus,
    completedAt?: Date | null,
    private readonly chargeRequestId?: number,
  ) {
    this.status = status ?? ChargeStatus.PENDING;
    this.completedAt = completedAt ?? null;
  }

  static create(userId: number, amount: Point): PointChargeRequest {
    if (!amount.isBetween(PointChargeRequest.MIN_CHARGE, PointChargeRequest.MAX_CHARGE)) {
      throw new BadRequestException(
        `충전 금액은 ${PointChargeRequest.MIN_CHARGE.toLocaleString()}원 ~ ${PointChargeRequest.MAX_CHARGE.toLocaleString()}원 사이여야 합니다.`,
      );
    }

    return new PointChargeRequest(userId, amount, new Date(), ChargeStatus.PENDING, null, undefined);
  }

  complete(): void {
    if (this.status !== ChargeStatus.PENDING) {
      throw new BadRequestException('대기 중인 충전 요청만 완료할 수 있습니다.');
    }

    this.status = ChargeStatus.COMPLETED;
    this.completedAt = new Date();
  }

  fail(): void {
    if (this.status !== ChargeStatus.PENDING) {
      throw new BadRequestException('대기 중인 충전 요청만 실패 처리할 수 있습니다.');
    }

    this.status = ChargeStatus.FAILED;
    this.completedAt = new Date();
  }

  getChargeRequestId(): number | undefined {
    return this.chargeRequestId;
  }

  getUserId(): number {
    return this.userId;
  }

  getAmount(): Point {
    return this.amount;
  }

  getStatus(): ChargeStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getCompletedAt(): Date | null {
    return this.completedAt;
  }
}
