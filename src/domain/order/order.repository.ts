import { OrderItem } from './order-item.entity';
import { Order } from './order.entity';

export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');

export interface OrderRepository {
  save(order: Order): Promise<Order>;
  findById(orderId: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
  findByIdWithLock(orderId: string): Promise<Order | null>;
  saveItems(items: OrderItem[]): Promise<void>;
  findItemsByOrderId(orderId: string): Promise<OrderItem[]>;
}
