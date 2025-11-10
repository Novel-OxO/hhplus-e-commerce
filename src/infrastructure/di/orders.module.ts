import { Module } from '@nestjs/common';
import { CouponService } from '@/application/coupon.service';
import { OrderService } from '@/application/order.service';
import { ORDER_REPOSITORY } from '@/domain/order/order.repository';
import { PRODUCT_REPOSITORY } from '@/domain/product/product.repository';
// import { CartMemoryRepository } from '@/infrastructure/database/cart-memory.repository';
// import { CouponMemoryRepository } from '@/infrastructure/database/coupon-memory.repository';
// import { OrderMemoryRepository } from '@/infrastructure/database/order-memory.repository';
// import { ProductMemoryRepository } from '@/infrastructure/database/product-memory.repository';
import { OrdersController } from '@/presentation/http/order/orders.controller';
import { PointsModule } from './points.module';

@Module({
  imports: [PointsModule],
  controllers: [OrdersController],
  providers: [
    OrderService,
    CouponService,
    // {
    //   provide: ORDER_REPOSITORY,
    //   useClass: OrderMemoryRepository,
    // },
    // {
    //   provide: PRODUCT_REPOSITORY,
    //   useClass: ProductMemoryRepository,
    // },
    // {
    //   provide: COUPON_REPOSITORY,
    //   useClass: CouponMemoryRepository,
    // },
    // {
    //   provide: CART_REPOSITORY,
    //   useClass: CartMemoryRepository,
    // },
  ],
  exports: [ORDER_REPOSITORY, OrderService, PRODUCT_REPOSITORY],
})
export class OrdersModule {}
