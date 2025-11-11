import { BadRequestException } from '@/common/exceptions';

export class ProductOption {
  constructor(
    private readonly productOptionId: number,
    private readonly productId: number,
    private readonly optionName: string,
    private readonly sku: string,
    private readonly price: number,
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

  getProductOptionId(): number {
    return this.productOptionId;
  }

  getProductId(): number {
    return this.productId;
  }

  getOptionName(): string {
    return this.optionName;
  }

  getSku(): string {
    return this.sku;
  }

  getStock(): number {
    return this.stock;
  }

  getPrice(): number {
    return this.price;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
