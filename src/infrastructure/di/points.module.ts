import { Module } from '@nestjs/common';
import { PointsController } from '../../interfaces/http/points.controller';

@Module({
  controllers: [PointsController],
  providers: [],
})
export class PointsModule {}
