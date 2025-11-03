import { BadRequestException } from '@/common/exceptions';

export class ValidityPeriod {
  private readonly from: Date;
  private readonly until: Date;

  constructor(from: Date, until: Date) {
    if (from > until) {
      throw new BadRequestException('시작일은 종료일보다 이전이거나 같아야 합니다.');
    }

    this.from = from;
    this.until = until;
  }

  isValid(at: Date): boolean {
    return at >= this.from && at <= this.until;
  }

  isExpired(at: Date): boolean {
    return at > this.until;
  }

  getFrom(): Date {
    return this.from;
  }

  getUntil(): Date {
    return this.until;
  }
}
