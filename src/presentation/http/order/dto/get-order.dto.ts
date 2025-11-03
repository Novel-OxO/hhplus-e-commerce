export class GetOrderResponseDto {
  orderId: string;
  userId: string;
  status: string;
  items: OrderItemDetailDto[];
  orderAmount: number;
  discountAmount: number;
  finalAmount: number;
  userCouponId: string | null;
  createdAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
}

export class OrderItemDetailDto {
  id: string;
  productOptionId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
