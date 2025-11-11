import { Inject, Injectable } from '@nestjs/common';
import { CartItem } from '@/domain/cart/cart-item.entity';
import { Cart } from '@/domain/cart/cart.entity';
import { CART_REPOSITORY, type CartRepository } from '@/domain/cart/cart.repository';
import { ProductQuantity } from '@/domain/product/product-quantity.vo';
import { PRODUCT_REPOSITORY, type ProductRepository } from '@/domain/product/product.repository';

@Injectable()
export class CartService {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: CartRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async addCartItem(userId: number, productOptionId: number, quantity: ProductQuantity): Promise<CartItem> {
    const productOption = await this.productRepository.findOptionByIdOrElseThrow(productOptionId);

    // 이미 장바구니에 담겨 있는경우 수량 증가
    const existingCartItem = await this.cartRepository.findByUserIdAndProductOptionId(userId, productOptionId);
    if (existingCartItem) {
      existingCartItem.increaseQuantity(quantity);
      const savedCartItem = await this.cartRepository.save(existingCartItem);

      return savedCartItem;
    }
    // 장바구니에 새로 추가
    else {
      const price = productOption.getPrice();
      const newCartItem = CartItem.create(userId, productOption, quantity, price);
      const savedCartItem = await this.cartRepository.save(newCartItem);

      return savedCartItem;
    }
  }

  async getCart(userId: number): Promise<Cart> {
    const cartItems = await this.cartRepository.findByUserId(userId);

    if (cartItems.length === 0) {
      return Cart.empty();
    }

    return Cart.create(cartItems);
  }

  async removeCartItem(userId: number, cartItemId: number): Promise<void> {
    await this.cartRepository.deleteByCartIdAndUserId(cartItemId, userId);
  }

  async clearCart(userId: number): Promise<void> {
    await this.cartRepository.deleteByUserId(userId);
  }
}
