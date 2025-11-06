import { Module } from '@nestjs/common';
import { CouponService } from '@/application/coupon.service';
import { OrderService } from '@/application/order.service';
import { CART_REPOSITORY } from '@/domain/cart/cart.repository';
import { COUPON_REPOSITORY } from '@/domain/coupon/coupon.repository';
import { ORDER_REPOSITORY } from '@/domain/order/order.repository';
import { PRODUCT_REPOSITORY } from '@/domain/product/product.repository';
import { CartMemoryRepository } from '@/infrastructure/database/cart-memory.repository';
import { CouponMemoryRepository } from '@/infrastructure/database/coupon-memory.repository';
import { OrderMemoryRepository } from '@/infrastructure/database/order-memory.repository';
import { ProductMemoryRepository } from '@/infrastructure/database/product-memory.repository';
import { ID_GENERATOR } from '@/infrastructure/id-generator/id-generator.interface';
import { SnowflakeIdGenerator } from '@/infrastructure/id-generator/snowflake-id-generator';
import { OrdersController } from '@/presentation/http/order/orders.controller';
import { PointsModule } from './points.module';

@Module({
  imports: [PointsModule],
  controllers: [OrdersController],
  providers: [
    OrderService,
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
  ],
  exports: [ORDER_REPOSITORY, OrderService, PRODUCT_REPOSITORY],
})
export class OrdersModule {}
