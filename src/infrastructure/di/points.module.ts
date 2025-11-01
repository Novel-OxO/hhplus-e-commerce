import { Module } from '@nestjs/common';
import { PointsController } from '@presentation/http/points.controller';

@Module({
  controllers: [PointsController],
  providers: [],
})
export class PointsModule {}
