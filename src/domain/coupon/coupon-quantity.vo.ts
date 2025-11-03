import { BadRequestException } from '@/common/exceptions';

export class CouponQuantity {
  private readonly totalQuantity: number;
  private readonly issuedQuantity: number;

  constructor(totalQuantity: number, issuedQuantity: number = 0) {
    this.validateQuantity(totalQuantity, issuedQuantity);
    this.totalQuantity = totalQuantity;
    this.issuedQuantity = issuedQuantity;
  }

  private validateQuantity(totalQuantity: number, issuedQuantity: number): void {
    if (!Number.isInteger(totalQuantity) || totalQuantity < 1) {
      throw new BadRequestException('총 발급 수량은 1 이상의 정수여야 합니다.');
    }

    if (!Number.isInteger(issuedQuantity) || issuedQuantity < 0) {
      throw new BadRequestException('발급된 수량은 0 이상의 정수여야 합니다.');
    }

    if (issuedQuantity > totalQuantity) {
      throw new BadRequestException('발급된 수량이 총 수량을 초과할 수 없습니다.');
    }
  }

  canIssue(): boolean {
    return this.issuedQuantity < this.totalQuantity;
  }

  issue(): CouponQuantity {
    if (!this.canIssue()) {
      throw new BadRequestException('쿠폰 발급 수량이 모두 소진되었습니다.');
    }

    return new CouponQuantity(this.totalQuantity, this.issuedQuantity + 1);
  }

  getRemainingQuantity(): number {
    return this.totalQuantity - this.issuedQuantity;
  }

  getTotalQuantity(): number {
    return this.totalQuantity;
  }

  getIssuedQuantity(): number {
    return this.issuedQuantity;
  }
}
