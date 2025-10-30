import { Module } from '@nestjs/common';
import { CouponsController } from '@interfaces/http/coupons.controller';

@Module({
  controllers: [CouponsController],
  providers: [],
})
export class CouponsModule {}
