import { BadRequestException } from '@/common/exceptions';

export class ProductOption {
  constructor(
    private readonly id: string,
    private readonly productId: string,
    private readonly name: string,
    private readonly additionalPrice: number,
    private stock: number,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  canOrder(quantity: number): boolean {
    return this.stock >= quantity;
  }

  decreaseStock(quantity: number): void {
    if (!this.canOrder(quantity)) {
      throw new BadRequestException('재고가 부족합니다.');
    }
    this.stock -= quantity;
  }

  increaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new BadRequestException('재고 증가 수량은 0보다 커야 합니다.');
    }
    this.stock += quantity;
  }

  getId(): string {
    return this.id;
  }

  getProductId(): string {
    return this.productId;
  }

  getName(): string {
    return this.name;
  }

  getAdditionalPrice(): number {
    return this.additionalPrice;
  }

  getStock(): number {
    return this.stock;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
