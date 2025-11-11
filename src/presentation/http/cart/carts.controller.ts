import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CartService } from '@/application/cart/cart.service';
import { ProductQuantity } from '@/domain/product/product-quantity.vo';
import { ApiAddCartItem, ApiGetCart, ApiDeleteCartItem, ApiClearCart } from '@/presentation/http/cart/carts.swagger';
import { AddCartItemRequestDto, AddCartItemResponseDto } from '@/presentation/http/cart/dto/add-cart-item.dto';
import { ClearCartResponseDto } from '@/presentation/http/cart/dto/clear-cart.dto';
import { DeleteCartItemResponseDto } from '@/presentation/http/cart/dto/delete-cart-item.dto';
import { GetCartResponseDto } from '@/presentation/http/cart/dto/get-cart.dto';

@ApiTags('Carts')
@Controller('carts')
export class CartsController {
  constructor(private readonly cartService: CartService) {}

  @Post('items')
  @ApiAddCartItem()
  async addCartItem(@Body() body: AddCartItemRequestDto): Promise<AddCartItemResponseDto> {
    const cartItem = await this.cartService.addCartItem(
      body.userId,
      body.productOptionId,
      ProductQuantity.from(body.quantity),
    );

    const productOption = cartItem.getProductOption();
    const currentStock = productOption.getStock();

    return {
      cartItemId: cartItem.getCartItemId() ?? 0,
      productOptionId: productOption.getProductOptionId(),
      quantity: cartItem.getQuantity().getValue(),
      currentStock,
      createdAt: cartItem.getCreatedAt(),
    };
  }

  @Get()
  @ApiGetCart()
  async getCart(@Query('userId') userId: string): Promise<GetCartResponseDto> {
    const numericUserId = parseInt(userId, 10);
    const cart = await this.cartService.getCart(numericUserId);

    const items = cart.getItems();
    const totalAmount = cart.calculateTotalAmount();

    return {
      items: items.map((cartItem) => {
        const productOption = cartItem.getProductOption();
        const currentPrice = cartItem.getPrice();
        const currentStock = productOption.getStock();
        const quantity = cartItem.getQuantity().getValue();
        const isStockSufficient = currentStock >= quantity;

        return {
          cartItemId: cartItem.getCartItemId() ?? 0,
          productOptionId: productOption.getProductOptionId(),
          quantity,
          currentPrice,
          currentStock,
          isStockSufficient,
          subtotal: currentPrice * quantity,
        };
      }),
      totalAmount,
      totalItems: items.length,
    };
  }

  @Delete('items/:itemId')
  @ApiDeleteCartItem()
  async deleteCartItem(
    @Param('itemId') itemId: string,
    @Query('userId') userId: string,
  ): Promise<DeleteCartItemResponseDto> {
    const numericUserId = parseInt(userId, 10);
    const numericItemId = parseInt(itemId, 10);
    await this.cartService.removeCartItem(numericUserId, numericItemId);

    return {
      message: '장바구니 항목이 삭제되었습니다',
    };
  }

  @Delete()
  @ApiClearCart()
  async clearCart(@Query('userId') userId: string): Promise<ClearCartResponseDto> {
    const numericUserId = parseInt(userId, 10);
    await this.cartService.clearCart(numericUserId);

    return {
      message: '장바구니가 비워졌습니다',
    };
  }
}
