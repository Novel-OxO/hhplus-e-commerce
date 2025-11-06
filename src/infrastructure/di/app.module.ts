import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CartsModule } from './carts.module';
import { ConcurrencyModule } from './concurrency.module';
import { CouponsModule } from './coupons.module';
import { OrdersModule } from './orders.module';
import { PointsModule } from './points.module';
import { ProductsModule } from './products.module';

const internalModules = [ConcurrencyModule, PointsModule, CouponsModule, ProductsModule, CartsModule, OrdersModule];

@Module({
  imports: [ScheduleModule.forRoot(), ...internalModules],
  controllers: [],
  providers: [],
})
export class AppModule {}
