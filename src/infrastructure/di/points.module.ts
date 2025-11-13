import { Module } from '@nestjs/common';
import { PointService } from '@/application/point/point.service';
import { PG_CLIENT } from '@/domain/payment/pg-client.interface';
import { POINT_REPOSITORY } from '@/domain/point/point.repository';
import { PrismaPointRepository } from '@/infrastructure/database/prisma-point.repository';
import { MockPGClient } from '@/infrastructure/external/mock-pg-client';
import { PointsController } from '@/presentation/http/point/points.controller';

@Module({
  controllers: [PointsController],
  providers: [
    PointService,
    {
      provide: POINT_REPOSITORY,
      useClass: PrismaPointRepository,
    },
    {
      provide: PG_CLIENT,
      useClass: MockPGClient,
    },
  ],
  exports: [PointService, POINT_REPOSITORY, PG_CLIENT],
})
export class PointsModule {}
