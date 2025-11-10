import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from '@/common/config/configuration';
import { validationSchema } from '@/common/config/env.validation';
import { CartsModule } from './carts.module';
import { ConcurrencyModule } from './concurrency.module';
import { CouponsModule } from './coupons.module';
import { OrdersModule } from './orders.module';
import { PointsModule } from './points.module';
import { PrismaModule } from './prisma.module';
import { ProductsModule } from './products.module';

const internalModules = [ConcurrencyModule, PointsModule, CouponsModule, ProductsModule, CartsModule, OrdersModule];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    PrismaModule,
    ScheduleModule.forRoot(),
    ...internalModules,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
