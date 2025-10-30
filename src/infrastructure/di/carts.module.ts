import { Module } from '@nestjs/common';
import { CartsController } from '../../interfaces/http/carts.controller';

@Module({
  controllers: [CartsController],
  providers: [],
})
export class CartsModule {}
