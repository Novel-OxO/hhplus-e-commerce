import { Injectable } from '@nestjs/common';
import { CartItem } from '@/domain/cart/cart-item.entity';
import { CartRepository } from '@/domain/cart/cart.repository';

@Injectable()
export class CartMemoryRepository implements CartRepository {
  private cartItems: Map<string, CartItem> = new Map();

  findByUserId(userId: string): Promise<CartItem[]> {
    return Promise.resolve(Array.from(this.cartItems.values()).filter((cartItem) => cartItem.getUserId() === userId));
  }

  findById(cartItemId: string): Promise<CartItem | null> {
    return Promise.resolve(this.cartItems.get(cartItemId) || null);
  }

  findByUserIdAndProductOptionId(userId: string, productOptionId: string): Promise<CartItem | null> {
    return Promise.resolve(
      Array.from(this.cartItems.values()).find(
        (cartItem) => cartItem.getUserId() === userId && cartItem.getProductOptionId() === productOptionId,
      ) || null,
    );
  }

  save(cartItem: CartItem): Promise<CartItem> {
    this.cartItems.set(cartItem.getId(), cartItem);
    return Promise.resolve(cartItem);
  }

  delete(cartItemId: string): Promise<void> {
    this.cartItems.delete(cartItemId);
    return Promise.resolve();
  }

  deleteByUserId(userId: string): Promise<void> {
    Array.from(this.cartItems.entries()).forEach(([id, cartItem]) => {
      if (cartItem.getUserId() === userId) {
        this.cartItems.delete(id);
      }
    });
    return Promise.resolve();
  }
}
