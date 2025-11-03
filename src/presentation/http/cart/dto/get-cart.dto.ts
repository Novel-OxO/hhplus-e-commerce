export class GetCartResponseDto {
  items: CartItemDto[];
  totalAmount: number;
  totalItems: number;
}

export class CartItemDto {
  cartItemId: string;
  productOptionId: string;
  quantity: number;
  savedPrice: number;
  currentPrice: number;
  currentStock: number;
  isPriceChanged: boolean;
  isStockSufficient: boolean;
  subtotal: number;
}
