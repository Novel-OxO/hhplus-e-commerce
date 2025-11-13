import { Module } from '@nestjs/common';
import { CouponService } from '@/application/coupon/coupon.service';
import { COUPON_REPOSITORY } from '@/domain/coupon/coupon.repository';
import { PrismaCouponRepository } from '@/infrastructure/database/prisma-coupon.repository';
import { CouponsController } from '@/presentation/http/coupon/coupons.controller';

@Module({
  controllers: [CouponsController],
  providers: [
    CouponService,
    {
      provide: COUPON_REPOSITORY,
      useClass: PrismaCouponRepository,
    },
  ],
  exports: [COUPON_REPOSITORY],
})
export class CouponsModule {}
