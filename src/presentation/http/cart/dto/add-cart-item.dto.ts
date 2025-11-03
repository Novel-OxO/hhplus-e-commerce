export class AddCartItemRequestDto {
  userId: string;
  productOptionId: string;
  quantity: number;
}

export class AddCartItemResponseDto {
  cartItemId: string;
  productOptionId: string;
  quantity: number;
  savedPrice: number;
  currentStock: number;
  createdAt: Date;
}
