import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiCreateOrder,
  ApiGetOrder,
  ApiUpdateOrderStatus,
} from '@presentation/http/orders.swagger';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  @Post()
  @ApiCreateOrder()
  createOrder(
    @Body()
    body: {
      items: { productOptionId: number; quantity: number }[];
      expectedAmount: number;
      couponId?: number;
    },
  ) {
    console.log('Create order request:', body);
    return {
      orderId: 1,
      status: 'PENDING',
      items: [
        {
          productOptionId: 1,
          sku: 'TSHIRT-RED-M',
          productName: '베이직 티셔츠',
          optionDetails: '빨강/M',
          quantity: 2,
          unitPrice: 29000,
          subtotal: 58000,
        },
        {
          productOptionId: 5,
          sku: 'JEANS-BLUE-32',
          productName: '슬림 청바지',
          optionDetails: '블루/32',
          quantity: 1,
          unitPrice: 45000,
          subtotal: 45000,
        },
      ],
      orderAmount: 103000,
      discountAmount: 10300,
      finalAmount: 92700,
      pointsUsed: 92700,
      coupon: {
        id: 1,
        name: '신규 가입 10% 할인',
        discountType: 'PERCENTAGE',
        discountValue: 10,
      },
      pointBalance: {
        previousBalance: 100000,
        currentBalance: 7300,
      },
      createdAt: '2025-10-28T10:30:00Z',
    };
  }

  @Get(':orderId')
  @ApiGetOrder()
  getOrder(@Param('orderId') orderId: string) {
    console.log('Get order request:', { orderId });
    return {
      orderId: parseInt(orderId),
      status: 'PENDING',
      items: [
        {
          productOptionId: 1,
          sku: 'TSHIRT-RED-M',
          productName: '베이직 티셔츠',
          optionDetails: '빨강/M',
          quantity: 2,
          unitPrice: 29000,
          subtotal: 58000,
        },
      ],
      orderAmount: 58000,
      discountAmount: 0,
      finalAmount: 58000,
      pointsUsed: 58000,
      pointBalance: {
        previousBalance: 100000,
        currentBalance: 42000,
      },
      createdAt: '2025-10-28T10:30:00Z',
    };
  }

  @Patch(':orderId/status')
  @ApiUpdateOrderStatus()
  updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() body: { status: string },
  ) {
    console.log('Update order status request:', { orderId, ...body });
    return {
      orderId: parseInt(orderId),
      previousStatus: 'PENDING',
      currentStatus: body.status,
      updatedAt: '2025-10-28T15:30:00Z',
    };
  }
}
