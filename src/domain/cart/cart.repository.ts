import { CartItem } from './cart-item.entity';

export const CART_REPOSITORY = Symbol('CART_REPOSITORY');

export interface CartRepository {
  findByUserId(userId: string): Promise<CartItem[]>;
  findById(cartItemId: string): Promise<CartItem | null>;
  findByUserIdAndProductOptionId(userId: string, productOptionId: string): Promise<CartItem | null>;
  save(cartItem: CartItem): Promise<CartItem>;
  delete(cartItemId: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
