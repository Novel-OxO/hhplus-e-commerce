import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CartService } from '@/application/cart.service';
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
    const { cartItem, currentStock } = await this.cartService.addCartItem(
      body.userId,
      body.productOptionId,
      body.quantity,
    );

    return {
      cartItemId: cartItem.getCartItemId(),
      productOptionId: cartItem.getProductOptionId(),
      quantity: cartItem.getQuantity(),
      currentStock,
      createdAt: cartItem.getCreatedAt(),
    };
  }

  @Get()
  @ApiGetCart()
  async getCart(@Query('userId') userId: string): Promise<GetCartResponseDto> {
    const numericUserId = parseInt(userId, 10);
    const { items, totalAmount } = await this.cartService.getCart(numericUserId);

    return {
      items: items.map((item) => ({
        cartItemId: item.cartItem.getCartItemId(),
        productOptionId: item.cartItem.getProductOptionId(),
        quantity: item.cartItem.getQuantity(),
        currentPrice: item.currentPrice,
        currentStock: item.currentStock,
        isStockSufficient: item.isStockSufficient,
        subtotal: item.currentPrice * item.cartItem.getQuantity(),
      })),
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
