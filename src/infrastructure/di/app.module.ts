import { Module } from '@nestjs/common';
import { PointsModule } from './points.module';

const internalModules = [PointsModule];

@Module({
  imports: [...internalModules],
  controllers: [],
  providers: [],
})
export class AppModule {}
