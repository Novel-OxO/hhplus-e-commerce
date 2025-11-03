import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CouponService } from '@/application/coupon.service';
import { OrderService } from '@/application/order.service';
import { PointService } from '@/application/point.service';
import { CreateOrderRequestDto, CreateOrderResponseDto } from '@/presentation/http/order/dto/create-order.dto';
import { GetOrderResponseDto } from '@/presentation/http/order/dto/get-order.dto';
import {
  UpdateOrderStatusRequestDto,
  UpdateOrderStatusResponseDto,
} from '@/presentation/http/order/dto/update-order-status.dto';
import { ApiCreateOrder, ApiGetOrder, ApiUpdateOrderStatus } from '@/presentation/http/order/orders.swagger';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly orderService: OrderService,
    private readonly pointService: PointService,
    private readonly couponService: CouponService,
  ) {}

  @Post()
  @ApiCreateOrder()
  async createOrder(@Body() body: CreateOrderRequestDto): Promise<CreateOrderResponseDto> {
    const previousBalanceValue = await this.pointService.getBalanceValue(body.userId);
    const order = await this.orderService.createOrder(body.userId, body.items, body.expectedAmount, body.userCouponId);
    const currentBalanceValue = await this.pointService.getBalanceValue(body.userId);

    let couponInfo: { id: string; name: string; discountType: string; discountValue: number } | null = null;
    if (order.hasCoupon()) {
      couponInfo = await this.couponService.getCouponInfoByUserCouponId(order.getUserCouponId()!);
    }

    return {
      orderId: order.getId(),
      status: order.getStatus().getValue(),
      items: order.getItems().map((item) => ({
        productOptionId: item.getProductOptionId(),
        quantity: item.getQuantity(),
        unitPrice: item.getUnitPrice().getValue(),
        subtotal: item.getSubtotal().getValue(),
      })),
      orderAmount: order.getOrderAmount().getValue(),
      discountAmount: order.getDiscountAmount().getValue(),
      finalAmount: order.getFinalAmount().getValue(),
      pointsUsed: order.getFinalAmount().getValue(),
      coupon: couponInfo,
      pointBalance: {
        previousBalance: previousBalanceValue,
        currentBalance: currentBalanceValue,
      },
      createdAt: order.getCreatedAt(),
    };
  }

  @Get(':orderId')
  @ApiGetOrder()
  async getOrder(@Param('orderId') orderId: string, @Body() body: { userId: string }): Promise<GetOrderResponseDto> {
    const order = await this.orderService.getOrder(body.userId, orderId);

    return {
      orderId: order.getId(),
      userId: order.getUserId(),
      status: order.getStatus().getValue(),
      items: order.getItems().map((item) => ({
        id: item.getId(),
        productOptionId: item.getProductOptionId(),
        quantity: item.getQuantity(),
        unitPrice: item.getUnitPrice().getValue(),
        subtotal: item.getSubtotal().getValue(),
      })),
      orderAmount: order.getOrderAmount().getValue(),
      discountAmount: order.getDiscountAmount().getValue(),
      finalAmount: order.getFinalAmount().getValue(),
      userCouponId: order.getUserCouponId(),
      createdAt: order.getCreatedAt(),
      completedAt: order.getCompletedAt(),
      cancelledAt: order.getCancelledAt(),
    };
  }

  @Patch(':orderId/status')
  @ApiUpdateOrderStatus()
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() body: UpdateOrderStatusRequestDto,
  ): Promise<UpdateOrderStatusResponseDto> {
    const order = await this.orderService.updateOrderStatus(body.userId, orderId, body.status);

    return {
      orderId: order.getId(),
      status: order.getStatus().getValue(),
      message: '주문 상태가 변경되었습니다.',
    };
  }
}
