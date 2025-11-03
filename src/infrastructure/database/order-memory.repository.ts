import { Injectable } from '@nestjs/common';
import { OrderItem } from '@/domain/order/order-item.entity';
import { Order } from '@/domain/order/order.entity';
import { OrderRepository } from '@/domain/order/order.repository';

@Injectable()
export class OrderMemoryRepository implements OrderRepository {
  private orders: Map<string, Order> = new Map();
  private orderItems: Map<string, OrderItem> = new Map();

  save(order: Order): Promise<Order> {
    this.orders.set(order.getId(), order);
    return Promise.resolve(order);
  }

  findById(orderId: string): Promise<Order | null> {
    return Promise.resolve(this.orders.get(orderId) || null);
  }

  findByUserId(userId: string): Promise<Order[]> {
    return Promise.resolve(Array.from(this.orders.values()).filter((order) => order.getUserId() === userId));
  }

  findByIdWithLock(orderId: string): Promise<Order | null> {
    return Promise.resolve(this.orders.get(orderId) || null);
  }

  saveItems(items: OrderItem[]): Promise<void> {
    items.forEach((item) => {
      this.orderItems.set(item.getId(), item);
    });
    return Promise.resolve();
  }

  findItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    return Promise.resolve(Array.from(this.orderItems.values()).filter((item) => item.getOrderId() === orderId));
  }
}
