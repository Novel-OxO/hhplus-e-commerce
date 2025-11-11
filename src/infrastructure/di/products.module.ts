import { Module } from '@nestjs/common';
import { ProductRankingScheduler } from '@/application/product/product-ranking.scheduler';
import { ProductRankingService } from '@/application/product/product-ranking.service';
import { ProductService } from '@/application/product/product.service';
import { ProductRankingAggregator } from '@/domain/product/product-ranking.aggregator';
import { PRODUCT_REPOSITORY } from '@/domain/product/product.repository';
import { PrismaProductRepository } from '@/infrastructure/database/prisma-product.repository';
import { ProductsController } from '@/presentation/http/product/products.controller';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductService,
    ProductRankingService,
    ProductRankingScheduler,
    ProductRankingAggregator,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
  ],
  exports: [ProductService],
})
export class ProductsModule {}
