import { Module } from '@nestjs/common';
import { CouponService } from '@/application/coupon.service';
import { OrderService } from '@/application/order.service';
import { PointService } from '@/application/point.service';
import { CART_REPOSITORY } from '@/domain/cart/cart.repository';
import { COUPON_REPOSITORY } from '@/domain/coupon/coupon.repository';
import { ORDER_REPOSITORY } from '@/domain/order/order.repository';
import { PG_CLIENT } from '@/domain/payment/pg-client.interface';
import { POINT_REPOSITORY } from '@/domain/point/point.repository';
import { PRODUCT_REPOSITORY } from '@/domain/product/product.repository';
import { CartMemoryRepository } from '@/infrastructure/database/cart-memory.repository';
import { CouponMemoryRepository } from '@/infrastructure/database/coupon-memory.repository';
import { OrderMemoryRepository } from '@/infrastructure/database/order-memory.repository';
import { PointMemoryRepository } from '@/infrastructure/database/point-memory.repository';
import { ProductMemoryRepository } from '@/infrastructure/database/product-memory.repository';
import { MockPGClient } from '@/infrastructure/external/mock-pg-client';
import { ID_GENERATOR } from '@/infrastructure/id-generator/id-generator.interface';
import { SnowflakeIdGenerator } from '@/infrastructure/id-generator/snowflake-id-generator';
import { OrdersController } from '@/presentation/http/order/orders.controller';

@Module({
  controllers: [OrdersController],
  providers: [
    OrderService,
    PointService,
    CouponService,
    {
      provide: ORDER_REPOSITORY,
      useClass: OrderMemoryRepository,
    },
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductMemoryRepository,
    },
    {
      provide: POINT_REPOSITORY,
      useClass: PointMemoryRepository,
    },
    {
      provide: COUPON_REPOSITORY,
      useClass: CouponMemoryRepository,
    },
    {
      provide: CART_REPOSITORY,
      useClass: CartMemoryRepository,
    },
    {
      provide: ID_GENERATOR,
      useClass: SnowflakeIdGenerator,
    },
    {
      provide: PG_CLIENT,
      useClass: MockPGClient,
    },
  ],
  exports: [ORDER_REPOSITORY, OrderService],
})
export class OrdersModule {}
