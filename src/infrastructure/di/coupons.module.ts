import { Module } from '@nestjs/common';
import { CouponService } from '@/application/coupon.service';
import { COUPON_REPOSITORY } from '@/domain/coupon/coupon.repository';
// import { CouponMemoryRepository } from '@/infrastructure/database/coupon-memory.repository';
import { CouponsController } from '@/presentation/http/coupon/coupons.controller';

@Module({
  controllers: [CouponsController],
  providers: [
    // {
    //   provide: COUPON_REPOSITORY,
    //   useClass: CouponMemoryRepository,
    // },
    CouponService,
  ],
  exports: [COUPON_REPOSITORY],
})
export class CouponsModule {}
