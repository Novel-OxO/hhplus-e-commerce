import { Inject, Injectable } from '@nestjs/common';
import { OrderContextBuilder } from '@/domain/order/order-context.builder';
import { OrderFulfillmentService } from '@/domain/order/order-fulfillment.service';
import { Order } from '@/domain/order/order.entity';
import { ORDER_REPOSITORY, type OrderRepository } from '@/domain/order/order.repository';
import { type CreateOrderItemDto } from './create-order-item.dto';

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    private readonly orderContextBuilder: OrderContextBuilder,
    private readonly orderFulfillmentService: OrderFulfillmentService,
  ) {}
  // TODO Transaction 처리
  async createOrder(userId: number, items: CreateOrderItemDto[], userCouponId?: number): Promise<Order> {
    const orderContext = await this.orderContextBuilder.buildOrderContext(userId, items, userCouponId);

    const orderResult = this.orderFulfillmentService.fulfill({
      userId,
      productDetails: orderContext.productDetailsWithQuantity,
      userCoupon: orderContext.coupon,
      pointBalance: orderContext.pointBalance,
    });

    await this.orderContextBuilder.persistOrderResult(userId, orderResult);

    return orderResult.order;
  }

  async getOrder(userId: string, orderId: string): Promise<Order> {
    return await this.orderRepository.findByIdAndUserIdOrElseThrow(orderId, userId);
  }
}
