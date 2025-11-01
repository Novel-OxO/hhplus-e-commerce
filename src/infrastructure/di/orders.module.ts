import { Module } from '@nestjs/common';
import { OrdersController } from '@presentation/http/orders.controller';

@Module({
  controllers: [OrdersController],
  providers: [],
})
export class OrdersModule {}
