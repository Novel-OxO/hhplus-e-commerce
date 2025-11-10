import { Module } from '@nestjs/common';
import { PointService } from '@/application/point.service';
import { PG_CLIENT } from '@/domain/payment/pg-client.interface';
import { POINT_REPOSITORY } from '@/domain/point/point.repository';
// import { PointMemoryRepository } from '@/infrastructure/database/point-memory.repository';
import { MockPGClient } from '@/infrastructure/external/mock-pg-client';
import { PointsController } from '@/presentation/http/point/points.controller';

@Module({
  controllers: [PointsController],
  providers: [
    PointService,
    // {
    //   provide: POINT_REPOSITORY,
    //   useClass: PointMemoryRepository,
    // },
    {
      provide: PG_CLIENT,
      useClass: MockPGClient,
    },
  ],
  exports: [PointService, POINT_REPOSITORY, PG_CLIENT],
})
export class PointsModule {}
