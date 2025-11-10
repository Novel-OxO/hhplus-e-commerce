import { Point } from '@/domain/point/point.vo';

export class OrderItem {
  constructor(
    private readonly id: string,
    private readonly orderId: string,
    private readonly productOptionId: string,
    private readonly productName: string,
    private readonly optionName: string,
    private readonly sku: string,
    private readonly quantity: number,
    private readonly price: Point,
    private readonly subtotal: Point,
  ) {}

  validateSubtotal(): boolean {
    const expectedSubtotal = this.price.multiply(this.quantity);
    return this.subtotal.equals(expectedSubtotal);
  }

  getId(): string {
    return this.id;
  }

  getOrderId(): string {
    return this.orderId;
  }

  getProductOptionId(): string {
    return this.productOptionId;
  }

  getProductName(): string {
    return this.productName;
  }

  getOptionName(): string {
    return this.optionName;
  }

  getSku(): string {
    return this.sku;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getPrice(): Point {
    return this.price;
  }

  getSubtotal(): Point {
    return this.subtotal;
  }
}
