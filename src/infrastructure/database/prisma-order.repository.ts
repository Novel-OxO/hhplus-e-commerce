import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@/common/exceptions';
import { OrderItem } from '@/domain/order/order-item.entity';
import { OrderStatus } from '@/domain/order/order-status.vo';
import { Order } from '@/domain/order/order.entity';
import { OrderRepository } from '@/domain/order/order.repository';
import { Point } from '@/domain/point/point.vo';
import { PrismaProvider } from './prisma-provider.service';

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prismaProvider: PrismaProvider) {}

  async save(order: Order): Promise<Order> {
    const prisma = this.prismaProvider.get();
    const orderId = order.getId();

    if (orderId) {
      // Update existing order
      const updated = await prisma.order.update({
        where: { orderId: BigInt(orderId) },
        data: {
          userId: BigInt(order.userId),
          userCouponId: order.userCouponId ? BigInt(order.userCouponId) : null,
          orderStatus: order.orderStatus as any,
          totalPrice: order.totalPrice,
          discountPrice: order.discountPrice,
          finalPrice: order.finalPrice,
          completedAt: order.completedAt,
          cancelledAt: order.cancelledAt,
          updatedAt: order.updatedAt,
        },
        include: {
          orderItems: true,
        },
      });

      return this.toOrder(updated);
    } else {
      // Create new order
      const created = await prisma.order.create({
        data: {
          userId: BigInt(order.userId),
          userCouponId: order.userCouponId ? BigInt(order.userCouponId) : null,
          orderStatus: order.orderStatus as any,
          totalPrice: order.totalPrice,
          discountPrice: order.discountPrice,
          finalPrice: order.finalPrice,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          completedAt: order.completedAt,
          cancelledAt: order.cancelledAt,
        },
        include: {
          orderItems: true,
        },
      });

      const savedOrder = this.toOrder(created);
      const savedOrderId = savedOrder.getId()!;

      // Save order items with actual orderId
      const items = order.getItems().map((item) =>
        OrderItem.create({
          orderId: savedOrderId,
          productOptionId: item.getProductOptionId(),
          productName: item.getProductName(),
          optionName: item.getOptionName(),
          sku: item.getSku(),
          quantity: item.getQuantity(),
          price: item.getPrice().getValue(),
        }),
      );

      await this.saveItems(items);

      // Reload order with items
      return this.findById(savedOrder.getId()!.toString()) as Promise<Order>;
    }
  }

  async findById(orderId: string): Promise<Order | null> {
    const prisma = this.prismaProvider.get();
    const order = await prisma.order.findUnique({
      where: { orderId: BigInt(orderId) },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      return null;
    }

    return this.toOrder(order);
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const prisma = this.prismaProvider.get();
    const orders = await prisma.order.findMany({
      where: { userId: BigInt(userId) },
      include: {
        orderItems: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => this.toOrder(order));
  }

  async findByIdWithLock(orderId: string): Promise<Order | null> {
    const prisma = this.prismaProvider.get();
    const result = await prisma.$queryRaw<
      Array<{
        orderId: bigint;
        userId: bigint;
        userCouponId: bigint | null;
        orderStatus: string;
        totalPrice: any;
        discountPrice: any;
        finalPrice: any;
        createdAt: Date;
        updatedAt: Date;
        completedAt: Date | null;
        cancelledAt: Date | null;
      }>
    >`SELECT * FROM orders WHERE order_id = ${BigInt(orderId)} FOR UPDATE`;

    if (result.length === 0) {
      return null;
    }

    const orderData = result[0];
    const orderItems = await this.findItemsByOrderId(orderId);

    return new Order(
      Number(orderData.userId),
      orderData.userCouponId ? Number(orderData.userCouponId) : null,
      orderData.orderStatus as OrderStatus,
      Number(orderData.totalPrice),
      Number(orderData.discountPrice),
      Number(orderData.finalPrice),
      orderData.createdAt,
      orderData.updatedAt,
      orderData.completedAt,
      orderData.cancelledAt,
      orderItems,
      Number(orderData.orderId),
    );
  }

  async findByIdAndUserIdOrElseThrow(orderId: string, userId: string): Promise<Order> {
    const prisma = this.prismaProvider.get();
    const order = await prisma.order.findFirst({
      where: {
        orderId: BigInt(orderId),
        userId: BigInt(userId),
      },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`주문을 찾을 수 없습니다. orderId: ${orderId}, userId: ${userId}`);
    }

    return this.toOrder(order);
  }

  async saveItems(items: OrderItem[]): Promise<void> {
    const prisma = this.prismaProvider.get();

    await prisma.orderItem.createMany({
      data: items.map((item) => ({
        orderId: BigInt(item.getOrderId()),
        productOptionId: BigInt(item.getProductOptionId()),
        productName: item.getProductName(),
        optionName: item.getOptionName(),
        sku: item.getSku(),
        price: item.getPrice().getValue(),
        quantity: item.getQuantity(),
        subtotal: item.getSubtotal().getValue(),
        createdAt: new Date(),
      })),
    });
  }

  async findItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    const prisma = this.prismaProvider.get();
    const items = await prisma.orderItem.findMany({
      where: { orderId: BigInt(orderId) },
    });

    return items.map((item) => this.toOrderItem(item));
  }

  private toOrder(order: {
    orderId: bigint;
    userId: bigint;
    userCouponId: bigint | null;
    orderStatus: string;
    totalPrice: any;
    discountPrice: any;
    finalPrice: any;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
    cancelledAt: Date | null;
    orderItems?: Array<{
      orderItemId: bigint;
      orderId: bigint;
      productOptionId: bigint;
      productName: string;
      optionName: string;
      sku: string;
      price: any;
      quantity: number;
      subtotal: any;
      createdAt: Date;
    }>;
  }): Order {
    const items = order.orderItems?.map((item) => this.toOrderItem(item)) || [];

    return new Order(
      Number(order.userId),
      order.userCouponId ? Number(order.userCouponId) : null,
      order.orderStatus as OrderStatus,
      Number(order.totalPrice),
      Number(order.discountPrice),
      Number(order.finalPrice),
      order.createdAt,
      order.updatedAt,
      order.completedAt,
      order.cancelledAt,
      items,
      Number(order.orderId),
    );
  }

  private toOrderItem(item: {
    orderItemId: bigint;
    orderId: bigint;
    productOptionId: bigint;
    productName: string;
    optionName: string;
    sku: string;
    price: any;
    quantity: number;
    subtotal: any;
    createdAt: Date;
  }): OrderItem {
    return new OrderItem(
      Number(item.orderId),
      Number(item.productOptionId),
      item.productName,
      item.optionName,
      item.sku,
      item.quantity,
      new Point(Number(item.price)),
      new Point(Number(item.subtotal)),
      Number(item.orderItemId),
    );
  }
}
