import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiAddCartItem,
  ApiGetCart,
  ApiDeleteCartItem,
  ApiClearCart,
} from './carts.swagger';

@ApiTags('Carts')
@Controller('carts')
export class CartsController {
  @Post('items')
  @ApiAddCartItem()
  addCartItem(@Body() body: { productOptionId: number; quantity: number }) {
    console.log('Add cart item request:', body);
    return {
      cartItemId: 1,
      productOption: {
        id: body.productOptionId,
        sku: 'TSHIRT-RED-M',
        productName: '베이직 티셔츠',
        color: '빨강',
        size: 'M',
        price: 29000,
      },
      quantity: body.quantity,
      currentStock: 150,
    };
  }

  @Get()
  @ApiGetCart()
  getCart() {
    console.log('Get cart request');
    return {
      items: [
        {
          cartItemId: 1,
          productOption: {
            id: 1,
            sku: 'TSHIRT-RED-M',
            productId: 1,
            productName: '베이직 티셔츠',
            color: '빨강',
            size: 'M',
            price: 29000,
          },
          quantity: 2,
          savedPrice: 29000,
          currentPrice: 29000,
          currentStock: 150,
          isPriceChanged: false,
          isStockSufficient: true,
          subtotal: 58000,
        },
      ],
      totalAmount: 58000,
      totalItems: 1,
    };
  }

  @Delete('items/:itemId')
  @ApiDeleteCartItem()
  deleteCartItem(@Param('itemId') itemId: string) {
    console.log('Delete cart item request:', { itemId });
    return {
      message: '장바구니 항목이 삭제되었습니다',
      deletedItemId: parseInt(itemId),
    };
  }

  @Delete()
  @ApiClearCart()
  clearCart() {
    console.log('Clear cart request');
    return {
      message: '장바구니가 비워졌습니다',
      deletedCount: 3,
    };
  }
}
