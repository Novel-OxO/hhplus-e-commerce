import { Point } from '@/domain/point/point.vo';

export class OrderItem {
  constructor(
    private readonly id: string,
    private readonly orderId: string,
    private readonly productOptionId: string,
    private readonly quantity: number,
    private readonly unitPrice: Point,
    private readonly subtotal: Point,
  ) {}

  validateSubtotal(): boolean {
    const expectedSubtotal = this.unitPrice.multiply(this.quantity);
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

  getQuantity(): number {
    return this.quantity;
  }

  getUnitPrice(): Point {
    return this.unitPrice;
  }

  getSubtotal(): Point {
    return this.subtotal;
  }
}
