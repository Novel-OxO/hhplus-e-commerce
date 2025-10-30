import { Module } from '@nestjs/common';
import { OrdersController } from '../../interfaces/http/orders.controller';

@Module({
  controllers: [OrdersController],
  providers: [],
})
export class OrdersModule {}
