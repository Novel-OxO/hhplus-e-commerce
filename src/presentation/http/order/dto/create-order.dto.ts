export class CreateOrderItemDto {
  productOptionId: string;
  quantity: number;
}

export class CreateOrderRequestDto {
  userId: string;
  items: CreateOrderItemDto[];
  userCouponId?: string;
}

export class CreateOrderResponseDto {
  orderId: string;
  status: string;
  items: OrderItemDto[];
  orderAmount: number;
  discountAmount: number;
  finalAmount: number;
  pointsUsed: number;
  createdAt: Date;
}

export class OrderItemDto {
  productOptionId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export class CouponInfoDto {
  id: string;
  name: string;
  discountType: string;
  discountValue: number;
}

export class PointBalanceDto {
  previousBalance: number;
  currentBalance: number;
}
