import { Module } from '@nestjs/common';
import { CartService } from '@/application/cart/cart.service';
import { CART_REPOSITORY } from '@/domain/cart/cart.repository';
import { PRODUCT_REPOSITORY } from '@/domain/product/product.repository';
import { PrismaCartRepository } from '@/infrastructure/database/prisma-cart.repository';
import { PrismaProductRepository } from '@/infrastructure/database/prisma-product.repository';
import { CartsController } from '@/presentation/http/cart/carts.controller';

@Module({
  controllers: [CartsController],
  providers: [
    CartService,
    {
      provide: CART_REPOSITORY,
      useClass: PrismaCartRepository,
    },
    {
      provide: PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
  ],
  exports: [CART_REPOSITORY, CartService],
})
export class CartsModule {}
