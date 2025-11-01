import { Module } from '@nestjs/common';
import { CouponsController } from '@presentation/http/coupons.controller';

@Module({
  controllers: [CouponsController],
  providers: [],
})
export class CouponsModule {}
