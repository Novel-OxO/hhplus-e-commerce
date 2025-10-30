import { Module } from '@nestjs/common';
import { PointsModule } from './points.module';
import { CouponsModule } from './coupons.module';

const internalModules = [PointsModule, CouponsModule];

@Module({
  imports: [...internalModules],
  controllers: [],
  providers: [],
})
export class AppModule {}
