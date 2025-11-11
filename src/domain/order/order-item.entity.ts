import { Point } from '@/domain/point/point.vo';

export class OrderItem {
  constructor(
    private orderId: number,
    private productOptionId: number,
    private productName: string,
    private optionName: string,
    private sku: string,
    private quantity: number,
    private price: Point,
    private subtotal: Point,
    private id?: number,
  ) {}

  static create(params: {
    orderId: number;
    productOptionId: number;
    productName: string;
    optionName: string;
    sku: string;
    quantity: number;
    price: number;
  }): OrderItem {
    if (params.quantity <= 0) {
      throw new Error('수량은 1 이상이어야 합니다');
    }

    if (params.price < 0) {
      throw new Error('가격은 0 이상이어야 합니다');
    }

    const price = new Point(params.price);
    const subtotal = new Point(params.price * params.quantity);

    return new OrderItem(
      params.orderId,
      params.productOptionId,
      params.productName,
      params.optionName,
      params.sku,
      params.quantity,
      price,
      subtotal,
    );
  }

  validateSubtotal(): boolean {
    const expectedSubtotal = this.price.multiply(this.quantity);
    return this.subtotal.equals(expectedSubtotal);
  }

  getId(): number | undefined {
    return this.id;
  }

  getOrderId(): number {
    return this.orderId;
  }

  getProductOptionId(): number {
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
