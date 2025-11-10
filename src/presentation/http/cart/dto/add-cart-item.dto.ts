export class AddCartItemRequestDto {
  userId: number;
  productOptionId: number;
  quantity: number;
}

export class AddCartItemResponseDto {
  cartItemId: number;
  productOptionId: number;
  quantity: number;
  currentStock: number;
  createdAt: Date;
}
