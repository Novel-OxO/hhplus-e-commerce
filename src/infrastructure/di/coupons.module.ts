import { Module } from '@nestjs/common';
import { CouponService } from '@/application/coupon.service';
import { COUPON_REPOSITORY } from '@/domain/coupon/coupon.repository';
import { CouponMemoryRepository } from '@/infrastructure/database/coupon-memory.repository';
import { CouponsController } from '@/presentation/http/coupon/coupons.controller';
import { ID_GENERATOR } from '@/infrastructure/id-generator/id-generator.interface';
import { SnowflakeIdGenerator } from '@/infrastructure/id-generator/snowflake-id-generator';

@Module({
  controllers: [CouponsController],
  providers: [
    {
      provide: COUPON_REPOSITORY,
      useClass: CouponMemoryRepository,
    },
    {
      provide: ID_GENERATOR,
      useClass: SnowflakeIdGenerator,
    },
    CouponService,
  ],
  exports: [COUPON_REPOSITORY],
})
export class CouponsModule {}
