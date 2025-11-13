import { Module } from '@nestjs/common';
import { CouponService } from '@/application/coupon/coupon.service';
import { OrderService } from '@/application/order/order.service';
import { CART_REPOSITORY } from '@/domain/cart/cart.repository';
import { COUPON_REPOSITORY } from '@/domain/coupon/coupon.repository';
import { OrderContextBuilder } from '@/domain/order/order-context.builder';
import { OrderFulfillmentService } from '@/domain/order/order-fulfillment.service';
import { ORDER_REPOSITORY } from '@/domain/order/order.repository';
import { PRODUCT_REPOSITORY } from '@/domain/product/product.repository';
import { PrismaCartRepository } from '@/infrastructure/database/prisma-cart.repository';
import { PrismaCouponRepository } from '@/infrastructure/database/prisma-coupon.repository';
import { PrismaOrderRepository } from '@/infrastructure/database/prisma-order.repository';
import { PrismaProductRepository } from '@/infrastructure/database/prisma-product.repository';
import { OrdersController } from '@/presentation/http/order/orders.controller';
import { PointsModule } from './points.module';

@Module({
  imports: [PointsModule],
  controllers: [OrdersController],
  providers: [
    OrderService,
    CouponService,
    OrderFulfillmentService,
    OrderContextBuilder,
    {
      provide: ORDER_REPOSITORY,
      useClass: PrismaOrderRepository,
    },
    {
      provide: PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
    {
      provide: COUPON_REPOSITORY,
      useClass: PrismaCouponRepository,
    },
    {
      provide: CART_REPOSITORY,
      useClass: PrismaCartRepository,
    },
  ],
  exports: [ORDER_REPOSITORY, OrderService, PRODUCT_REPOSITORY],
})
export class OrdersModule {}
