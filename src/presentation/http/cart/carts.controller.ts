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
      cartItemId: cartItem.getId(),
      productOptionId: cartItem.getProductOptionId(),
      quantity: cartItem.getQuantity(),
      savedPrice: cartItem.getSavedPrice(),
      currentStock,
      createdAt: cartItem.getCreatedAt(),
    };
  }

  @Get()
  @ApiGetCart()
  async getCart(@Query('userId') userId: string): Promise<GetCartResponseDto> {
    const { items, totalAmount } = await this.cartService.getCart(userId);

    return {
      items: items.map((item) => ({
        cartItemId: item.cartItem.getId(),
        productOptionId: item.cartItem.getProductOptionId(),
        quantity: item.cartItem.getQuantity(),
        savedPrice: item.cartItem.getSavedPrice(),
        currentPrice: item.currentPrice,
        currentStock: item.currentStock,
        isPriceChanged: item.isPriceChanged,
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
    await this.cartService.removeCartItem(userId, itemId);

    return {
      message: '장바구니 항목이 삭제되었습니다',
    };
  }

  @Delete()
  @ApiClearCart()
  async clearCart(@Query('userId') userId: string): Promise<ClearCartResponseDto> {
    await this.cartService.clearCart(userId);

    return {
      message: '장바구니가 비워졌습니다',
    };
  }
}
