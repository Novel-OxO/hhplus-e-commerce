import { Module } from '@nestjs/common';
import { ProductService } from '@/application/product.service';
import { PRODUCT_REPOSITORY } from '@/domain/product/product.repository';
import { ProductMemoryRepository } from '@/infrastructure/database/product-memory.repository';
import { ProductsController } from '@/presentation/http/product/products.controller';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductService,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductMemoryRepository,
    },
  ],
  exports: [ProductService],
})
export class ProductsModule {}
