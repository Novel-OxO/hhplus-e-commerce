import { Inject, Injectable } from '@nestjs/common';
import { BadRequestException, ForbiddenException, NotFoundException } from '@/common/exceptions';
import { CartItem } from '@/domain/cart/cart-item.entity';
import { CART_REPOSITORY, type CartRepository } from '@/domain/cart/cart.repository';
import { PRODUCT_REPOSITORY, type ProductRepository } from '@/domain/product/product.repository';
import { ID_GENERATOR, type IdGenerator } from '@/infrastructure/id-generator/id-generator.interface';

@Injectable()
export class CartService {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: CartRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IdGenerator,
  ) {}

  async addCartItem(
    userId: string,
    productOptionId: string,
    quantity: number,
  ): Promise<{ cartItem: CartItem; currentStock: number }> {
    if (quantity <= 0) {
      throw new BadRequestException('수량은 1 이상이어야 합니다.');
    }

    const productOption = await this.productRepository.findOptionById(productOptionId);
    if (!productOption) {
      throw new NotFoundException('상품 옵션을 찾을 수 없습니다.');
    }
    // 이미 장바구니에 담겨 있는경우 수량 증가
    const existingCartItem = await this.cartRepository.findByUserIdAndProductOptionId(userId, productOptionId);
    if (existingCartItem) {
      existingCartItem.increaseQuantity(quantity);
      const savedCartItem = await this.cartRepository.save(existingCartItem);
      return {
        cartItem: savedCartItem,
        currentStock: productOption.getStock(),
      };
    }

    const newCartItem = new CartItem(
      this.idGenerator.generate(),
      userId,
      productOptionId,
      quantity,
      productOption.getAdditionalPrice(),
      new Date(),
    );

    const savedCartItem = await this.cartRepository.save(newCartItem);

    return {
      cartItem: savedCartItem,
      currentStock: productOption.getStock(),
    };
  }

  async getCart(userId: string): Promise<{
    items: Array<{
      cartItem: CartItem;
      currentPrice: number;
      currentStock: number;
      isPriceChanged: boolean;
      isStockSufficient: boolean;
    }>;
    totalAmount: number;
  }> {
    const cartItems = await this.cartRepository.findByUserId(userId);

    if (cartItems.length === 0) {
      return {
        items: [],
        totalAmount: 0,
      };
    }

    const productOptionIds = cartItems.map((item) => item.getProductOptionId());
    const productOptions = await Promise.all(productOptionIds.map((id) => this.productRepository.findOptionById(id)));

    const items = cartItems
      .map((cartItem) => {
        const productOption = productOptions.find((opt) => opt && opt.getId() === cartItem.getProductOptionId());

        if (!productOption) {
          return null;
        }

        const currentPrice = productOption.getAdditionalPrice();
        const currentStock = productOption.getStock();
        const isPriceChanged = cartItem.isPriceChanged(currentPrice);
        const isStockSufficient = productOption.canOrder(cartItem.getQuantity());

        return {
          cartItem,
          currentPrice,
          currentStock,
          isPriceChanged,
          isStockSufficient,
        };
      })
      .filter((item) => item !== null);

    const totalAmount = items.reduce((sum, item) => {
      return sum + item.currentPrice * item.cartItem.getQuantity();
    }, 0);

    return {
      items,
      totalAmount,
    };
  }

  async removeCartItem(userId: string, cartItemId: string): Promise<void> {
    const cartItem = await this.cartRepository.findById(cartItemId);

    if (!cartItem) {
      throw new NotFoundException('장바구니 아이템을 찾을 수 없습니다.');
    }

    if (cartItem.getUserId() !== userId) {
      throw new ForbiddenException('장바구니 아이템에 대한 권한이 없습니다.');
    }

    await this.cartRepository.delete(cartItemId);
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartRepository.deleteByUserId(userId);
  }
}
