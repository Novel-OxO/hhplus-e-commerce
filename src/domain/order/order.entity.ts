import { UserCoupon } from '@/domain/coupon/user-coupon.entity';
import { Point } from '@/domain/point/point.vo';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from './order-status.vo';
import type { ProductDetail } from '@/domain/product/product-detail.vo';

export class Order {
  private constructor(
    public userId: number,
    public userCouponId: number | null,
    public orderStatus: OrderStatus,
    public totalPrice: number,
    public discountPrice: number,
    public finalPrice: number,
    public createdAt: Date,
    public updatedAt: Date,
    public completedAt: Date | null,
    public cancelledAt: Date | null,
    private items: OrderItem[],
    public orderId?: number,
  ) {}

  static create(params: {
    userId: number;
    productDetails: Array<{ detail: ProductDetail; quantity: number }>;
    userCoupon?: UserCoupon | null;
  }): Order {
    params.productDetails.forEach(({ detail, quantity }) => {
      detail.decreaseStock(quantity);
    });

    const totalPrice = params.productDetails.reduce(
      (sum, { detail, quantity }) => sum + detail.getPrice() * quantity,
      0,
    );

    const discountPrice = params.userCoupon
      ? params.userCoupon.getCoupon().calculateDiscount(new Point(totalPrice)).getValue()
      : 0;

    const finalPrice = totalPrice - discountPrice;

    const now = new Date();

    // OrderItem 생성 (orderId는 0으로 설정, DB 저장 시 실제 orderId로 교체됨)
    const orderItems = params.productDetails.map(({ detail, quantity }) =>
      OrderItem.create({
        orderId: 0,
        productOptionId: detail.getProductOptionId(),
        productName: detail.getProductName(),
        optionName: detail.getOptionName(),
        sku: detail.getSku(),
        quantity,
        price: detail.getPrice(),
      }),
    );

    return new Order(
      params.userId,
      params.userCoupon ? (params.userCoupon.getId() as number) : null,
      OrderStatus.PENDING,
      totalPrice,
      discountPrice,
      finalPrice,
      now,
      now,
      null,
      null,
      orderItems,
    );
  }

  isPending(): boolean {
    return this.orderStatus === OrderStatus.PENDING;
  }

  isCompleted(): boolean {
    return this.orderStatus === OrderStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.orderStatus === OrderStatus.CANCELLED;
  }

  hasCoupon(): boolean {
    return this.userCouponId !== null;
  }

  hasDiscount(): boolean {
    return this.discountPrice > 0;
  }

  getId(): number | undefined {
    return this.orderId;
  }

  getUserId(): number {
    return this.userId;
  }

  getUserCouponId(): number | null {
    return this.userCouponId;
  }

  getFinalPrice(): number {
    return this.finalPrice;
  }

  getTotalPrice(): number {
    return this.totalPrice;
  }

  getDiscountPrice(): number {
    return this.discountPrice;
  }

  getItems(): OrderItem[] {
    return this.items;
  }
}
