import { Module } from '@nestjs/common';
import { CartService } from '@/application/cart/cart.service';
import { CART_REPOSITORY } from '@/domain/cart/cart.repository';
// import { CartMemoryRepository } from '@/infrastructure/database/cart-memory.repository';
// import { ProductMemoryRepository } from '@/infrastructure/database/product-memory.repository';
import { CartsController } from '@/presentation/http/cart/carts.controller';

@Module({
  controllers: [CartsController],
  providers: [
    CartService,
    // {
    //   provide: CART_REPOSITORY,
    //   useClass: CartMemoryRepository,
    // },
    // {
    //   provide: PRODUCT_REPOSITORY,
    //   useClass: ProductMemoryRepository,
    // },
  ],
  exports: [CART_REPOSITORY, CartService],
})
export class CartsModule {}
