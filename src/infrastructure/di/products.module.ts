import { Module } from '@nestjs/common';
import { ProductsController } from '../../interfaces/http/products.controller';

@Module({
  controllers: [ProductsController],
  providers: [],
})
export class ProductsModule {}
