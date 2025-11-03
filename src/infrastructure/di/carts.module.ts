import { Module } from '@nestjs/common';
import { CartService } from '@/application/cart.service';
import { CART_REPOSITORY } from '@/domain/cart/cart.repository';
import { PRODUCT_REPOSITORY } from '@/domain/product/product.repository';
import { CartMemoryRepository } from '@/infrastructure/database/cart-memory.repository';
import { ProductMemoryRepository } from '@/infrastructure/database/product-memory.repository';
import { CartsController } from '@/presentation/http/cart/carts.controller';
import { ID_GENERATOR } from '@/infrastructure/id-generator/id-generator.interface';
import { SnowflakeIdGenerator } from '@/infrastructure/id-generator/snowflake-id-generator';

@Module({
  controllers: [CartsController],
  providers: [
    CartService,
    {
      provide: CART_REPOSITORY,
      useClass: CartMemoryRepository,
    },
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductMemoryRepository,
    },
    {
      provide: ID_GENERATOR,
      useClass: SnowflakeIdGenerator,
    },
  ],
  exports: [CART_REPOSITORY, CartService],
})
export class CartsModule {}
