import { Module } from '@nestjs/common';
import { ProductsController } from '@presentation/http/products.controller';

@Module({
  controllers: [ProductsController],
  providers: [],
})
export class ProductsModule {}
