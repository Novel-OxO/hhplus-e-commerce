import { Inject, Injectable } from '@nestjs/common';
import { CART_REPOSITORY, type CartRepository } from '@/domain/cart/cart.repository';
import { COUPON_REPOSITORY, type CouponRepository } from '@/domain/coupon/coupon.repository';
import { UserCoupon } from '@/domain/coupon/user-coupon.entity';
import { Order } from '@/domain/order/order.entity';
import { ORDER_REPOSITORY, type OrderRepository } from '@/domain/order/order.repository';
import { PointBalance } from '@/domain/point/point-balance.entity';
import { PointTransaction } from '@/domain/point/point-transaction.entity';
import { POINT_REPOSITORY, type PointRepository } from '@/domain/point/point.repository';
import { ProductDetail } from '@/domain/product/product-detail.vo';
import { PRODUCT_REPOSITORY, type ProductRepository } from '@/domain/product/product.repository';
import { type CreateOrderItemDto } from '@application/order/create-order-item.dto';

export interface OrderContext {
  coupon: UserCoupon | null;
  productDetailsWithQuantity: Array<{ detail: ProductDetail; quantity: number }>;
  pointBalance: PointBalance;
}

export interface OrderFulfillmentResult {
  order: Order;
  updatedCoupon: UserCoupon | null;
  updatedBalance: PointBalance;
  pointTransaction: PointTransaction;
}

@Injectable()
export class OrderContextBuilder {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(POINT_REPOSITORY)
    private readonly pointRepository: PointRepository,
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: CouponRepository,
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: CartRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
  ) {}

  async buildOrderContext(userId: number, items: CreateOrderItemDto[], userCouponId?: number): Promise<OrderContext> {
    let coupon: UserCoupon | null = null;
    if (userCouponId) {
      coupon = await this.couponRepository.findUserCouponById(userCouponId);
    }

    const productDetailsWithQuantity = await this.productRepository
      .findDetailsByOptionIds(items.map((item) => item.productOptionId))
      .then((details) =>
        details.map((detail) => ({
          detail,
          quantity: items.find((item) => item.productOptionId === detail.getProductOptionId().toString())!.quantity,
        })),
      );

    const pointBalance = await this.pointRepository.findBalanceByUserIdOrElseThrow(userId);

    return {
      coupon,
      productDetailsWithQuantity,
      pointBalance,
    };
  }

  async persistOrderResult(userId: number, result: OrderFulfillmentResult): Promise<void> {
    await this.orderRepository.save(result.order);

    if (result.updatedCoupon) {
      result.updatedCoupon.use(result.order.getId()!.toString());
      await this.couponRepository.saveUserCoupon(result.updatedCoupon);
    }
    await this.pointRepository.saveBalance(result.updatedBalance);
    await this.pointRepository.createTransaction(result.pointTransaction);
    await this.cartRepository.deleteByUserId(userId);
  }
}
