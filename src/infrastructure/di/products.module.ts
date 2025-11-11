import { Module } from '@nestjs/common';
import { ProductRankingScheduler } from '@/application/product/product-ranking.scheduler';
import { ProductRankingService } from '@/application/product/product-ranking.service';
import { ProductService } from '@/application/product/product.service';
// import { ProductMemoryRepository } from '@/infrastructure/database/product-memory.repository';
import { ProductsController } from '@/presentation/http/product/products.controller';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductService,
    ProductRankingService,
    ProductRankingScheduler,
    // {
    //   provide: PRODUCT_REPOSITORY,
    //   useClass: ProductMemoryRepository,
    // },
  ],
  exports: [ProductService],
})
export class ProductsModule {}
