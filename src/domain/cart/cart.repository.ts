import { CartItem } from './cart-item.entity';

export const CART_REPOSITORY = Symbol('CART_REPOSITORY');

export interface CartRepository {
  findByUserId(userId: number): Promise<CartItem[]>;
  findById(cartItemId: number): Promise<CartItem | null>;
  findByUserIdAndProductOptionId(userId: number, productOptionId: number): Promise<CartItem | null>;
  save(cartItem: CartItem): Promise<CartItem>;
  delete(cartItemId: number): Promise<void>;
  deleteByUserId(userId: number): Promise<void>;
}
