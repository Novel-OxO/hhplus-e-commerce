import { Module } from '@nestjs/common';
import { ProductRankingScheduler } from '@/application/product-ranking.scheduler';
import { ProductRankingService } from '@/application/product-ranking.service';
import { ProductService } from '@/application/product.service';
import { PRODUCT_REPOSITORY } from '@/domain/product/product.repository';
import { ProductMemoryRepository } from '@/infrastructure/database/product-memory.repository';
import { ID_GENERATOR } from '@/infrastructure/id-generator/id-generator.interface';
import { SnowflakeIdGenerator } from '@/infrastructure/id-generator/snowflake-id-generator';
import { ProductsController } from '@/presentation/http/product/products.controller';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductService,
    ProductRankingService,
    ProductRankingScheduler,
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductMemoryRepository,
    },
    {
      provide: ID_GENERATOR,
      useClass: SnowflakeIdGenerator,
    },
  ],
  exports: [ProductService],
})
export class ProductsModule {}
