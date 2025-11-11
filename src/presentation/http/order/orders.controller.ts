import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrderService } from '@/application/order/order.service';
import { CreateOrderRequestDto, CreateOrderResponseDto } from '@/presentation/http/order/dto/create-order.dto';
import { GetOrderResponseDto } from '@/presentation/http/order/dto/get-order.dto';
import { ApiCreateOrder, ApiGetOrder } from '@/presentation/http/order/orders.swagger';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiCreateOrder()
  async createOrder(@Body() body: CreateOrderRequestDto): Promise<CreateOrderResponseDto> {
    const order = await this.orderService.createOrder(
      Number(body.userId),
      body.items,
      body.userCouponId ? Number(body.userCouponId) : undefined,
    );

    return {
      orderId: order.getId()?.toString() ?? '',
      status: order.orderStatus,
      items: order.getItems().map((item) => ({
        productOptionId: item.getProductOptionId().toString(),
        quantity: item.getQuantity(),
        unitPrice: item.getPrice().getValue(),
        subtotal: item.getSubtotal().getValue(),
      })),
      orderAmount: order.getTotalPrice(),
      discountAmount: order.getDiscountPrice(),
      finalAmount: order.getFinalPrice(),
      pointsUsed: order.getFinalPrice(),
      createdAt: order.createdAt,
    };
  }

  @Get(':orderId')
  @ApiGetOrder()
  async getOrder(@Param('orderId') orderId: string, @Body() body: { userId: string }): Promise<GetOrderResponseDto> {
    const order = await this.orderService.getOrder(body.userId, orderId);

    return {
      orderId: order.getId()?.toString() ?? '',
      userId: order.getUserId().toString(),
      status: order.orderStatus,
      items: order.getItems().map((item) => ({
        id: item.getId()?.toString() ?? '',
        productOptionId: item.getProductOptionId().toString(),
        quantity: item.getQuantity(),
        unitPrice: item.getPrice().getValue(),
        subtotal: item.getSubtotal().getValue(),
      })),
      orderAmount: order.getTotalPrice(),
      discountAmount: order.getDiscountPrice(),
      finalAmount: order.getFinalPrice(),
      userCouponId: order.getUserCouponId()?.toString() ?? null,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
    };
  }
}
