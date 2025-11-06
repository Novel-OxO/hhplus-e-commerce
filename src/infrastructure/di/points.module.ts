import { Module } from '@nestjs/common';
import { PointService } from '@/application/point.service';
import { PG_CLIENT } from '@/domain/payment/pg-client.interface';
import { POINT_REPOSITORY } from '@/domain/point/point.repository';
import { PointMemoryRepository } from '@/infrastructure/database/point-memory.repository';
import { MockPGClient } from '@/infrastructure/external/mock-pg-client';
import { ID_GENERATOR } from '@/infrastructure/id-generator/id-generator.interface';
import { SnowflakeIdGenerator } from '@/infrastructure/id-generator/snowflake-id-generator';
import { PointsController } from '@/presentation/http/point/points.controller';

@Module({
  controllers: [PointsController],
  providers: [
    PointService,
    {
      provide: POINT_REPOSITORY,
      useClass: PointMemoryRepository,
    },
    {
      provide: ID_GENERATOR,
      useClass: SnowflakeIdGenerator,
    },
    {
      provide: PG_CLIENT,
      useClass: MockPGClient,
    },
  ],
  exports: [PointService, POINT_REPOSITORY, PG_CLIENT],
})
export class PointsModule {}
