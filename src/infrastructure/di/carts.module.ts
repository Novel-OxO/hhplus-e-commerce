import { Module } from '@nestjs/common';
import { CartsController } from '@presentation/http/carts.controller';

@Module({
  controllers: [CartsController],
  providers: [],
})
export class CartsModule {}
