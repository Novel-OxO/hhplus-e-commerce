import { BadRequestException } from '@/common/exceptions/bad-request.exception';

export class ProductQuantity {
  private static readonly MIN_QUANTITY = 1;
  private static readonly MAX_QUANTITY = 1000;

  private constructor(private readonly value: number) {
    if (!Number.isInteger(value)) {
      throw new BadRequestException('수량은 정수여야 합니다.');
    }

    if (value < ProductQuantity.MIN_QUANTITY) {
      throw new BadRequestException(`수량은 최소 ${ProductQuantity.MIN_QUANTITY}개 이상이어야 합니다.`);
    }

    if (value > ProductQuantity.MAX_QUANTITY) {
      throw new BadRequestException(`수량은 최대 ${ProductQuantity.MAX_QUANTITY}개를 초과할 수 없습니다.`);
    }
  }

  static from(value: number): ProductQuantity {
    return new ProductQuantity(value);
  }

  getValue(): number {
    return this.value;
  }

  increase(value: number): ProductQuantity {
    return ProductQuantity.from(this.value + value);
  }
}
