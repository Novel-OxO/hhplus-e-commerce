import { Module } from '@nestjs/common';
import { PointsModule } from './points.module';
import { CouponsModule } from './coupons.module';
import { ProductsModule } from './products.module';
import { CartsModule } from './carts.module';
import { OrdersModule } from './orders.module';

const internalModules = [
  PointsModule,
  CouponsModule,
  ProductsModule,
  CartsModule,
  OrdersModule,
];

@Module({
  imports: [...internalModules],
  controllers: [],
  providers: [],
})
export class AppModule {}
