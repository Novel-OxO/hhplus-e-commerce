export class UpdateOrderStatusRequestDto {
  userId: string;
  status: string;
}

export class UpdateOrderStatusResponseDto {
  orderId: string;
  status: string;
  message: string;
}
