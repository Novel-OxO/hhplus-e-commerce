import { Module } from '@nestjs/common';
import { CartsModule } from './carts.module';
import { CouponsModule } from './coupons.module';
import { OrdersModule } from './orders.module';
import { PointsModule } from './points.module';
import { ProductsModule } from './products.module';

const internalModules = [PointsModule, CouponsModule, ProductsModule, CartsModule, OrdersModule];

@Module({
  imports: [...internalModules],
  controllers: [],
  providers: [],
})
export class AppModule {}
