import { Module } from '@nestjs/common';
import { PointsModule } from './points.module';
import { CouponsModule } from './coupons.module';
import { ProductsModule } from './products.module';

const internalModules = [PointsModule, CouponsModule, ProductsModule];

@Module({
  imports: [...internalModules],
  controllers: [],
  providers: [],
})
export class AppModule {}
