export class GetCartResponseDto {
  items: CartItemDto[];
  totalAmount: number;
  totalItems: number;
}

export class CartItemDto {
  cartItemId: number;
  productOptionId: number;
  quantity: number;
  currentPrice: number;
  currentStock: number;
  isStockSufficient: boolean;
  subtotal: number;
}
