import { Injectable } from '@nestjs/common';
import { CartItem } from '@/domain/cart/cart-item.entity';
import { CartRepository } from '@/domain/cart/cart.repository';
import { ProductOption } from '@/domain/product/product-option.entity';
import { ProductQuantity } from '@/domain/product/product-quantity.vo';
import { PrismaProvider } from './prisma-provider.service';

@Injectable()
export class PrismaCartRepository implements CartRepository {
  constructor(private readonly prismaProvider: PrismaProvider) {}

  async findByUserId(userId: number): Promise<CartItem[]> {
    const prisma = this.prismaProvider.get();
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: BigInt(userId) },
      include: {
        productOption: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return cartItems.map((item) => this.toCartItem(item));
  }

  async findById(cartItemId: number): Promise<CartItem | null> {
    const prisma = this.prismaProvider.get();
    const cartItem = await prisma.cartItem.findUnique({
      where: { cartItemId: BigInt(cartItemId) },
      include: {
        productOption: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cartItem) {
      return null;
    }

    return this.toCartItem(cartItem);
  }

  async findByUserIdAndProductOptionId(userId: number, productOptionId: number): Promise<CartItem | null> {
    const prisma = this.prismaProvider.get();
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        userId: BigInt(userId),
        productOptionId: BigInt(productOptionId),
      },
      include: {
        productOption: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cartItem) {
      return null;
    }

    return this.toCartItem(cartItem);
  }

  async save(cartItem: CartItem): Promise<CartItem> {
    const prisma = this.prismaProvider.get();
    const cartItemId = cartItem.getCartItemId();

    if (cartItemId) {
      // Update existing cart item
      const updated = await prisma.cartItem.update({
        where: { cartItemId: BigInt(cartItemId) },
        data: {
          quantity: cartItem.getQuantity().getValue(),
          price: cartItem.getPrice(),
          updatedAt: cartItem.getUpdatedAt(),
        },
        include: {
          productOption: {
            include: {
              product: true,
            },
          },
        },
      });

      return this.toCartItem(updated);
    } else {
      // Create new cart item
      const created = await prisma.cartItem.create({
        data: {
          userId: BigInt(cartItem.getUserId()),
          productOptionId: BigInt(cartItem.getProductOption().getProductOptionId()),
          quantity: cartItem.getQuantity().getValue(),
          price: cartItem.getPrice(),
          createdAt: cartItem.getCreatedAt(),
          updatedAt: cartItem.getUpdatedAt(),
        },
        include: {
          productOption: {
            include: {
              product: true,
            },
          },
        },
      });

      return this.toCartItem(created);
    }
  }

  async delete(cartItemId: number): Promise<void> {
    const prisma = this.prismaProvider.get();
    await prisma.cartItem.delete({
      where: { cartItemId: BigInt(cartItemId) },
    });
  }

  async deleteByUserId(userId: number): Promise<void> {
    const prisma = this.prismaProvider.get();
    await prisma.cartItem.deleteMany({
      where: { userId: BigInt(userId) },
    });
  }

  async deleteByCartIdAndUserId(cartItemId: number, userId: number): Promise<void> {
    const prisma = this.prismaProvider.get();
    await prisma.cartItem.deleteMany({
      where: {
        cartItemId: BigInt(cartItemId),
        userId: BigInt(userId),
      },
    });
  }

  private toCartItem(cartItem: {
    cartItemId: bigint;
    userId: bigint;
    productOptionId: bigint;
    quantity: number;
    price: any; // Prisma Decimal type
    createdAt: Date;
    updatedAt: Date;
    productOption: {
      productOptionId: bigint;
      productId: bigint;
      optionName: string;
      sku: string;
      stockQuantity: number;
      createdAt: Date;
      updatedAt: Date;
      product: {
        basePrice: any; // Prisma Decimal type
      };
    };
  }): CartItem {
    const productOption = this.toProductOption(cartItem.productOption, cartItem.productOption.product.basePrice);

    return new CartItem(
      Number(cartItem.userId),
      productOption,
      ProductQuantity.from(cartItem.quantity),
      Number(cartItem.price),
      cartItem.createdAt,
      cartItem.updatedAt,
      Number(cartItem.cartItemId),
    );
  }

  private toProductOption(
    option: {
      productOptionId: bigint;
      productId: bigint;
      optionName: string;
      sku: string;
      stockQuantity: number;
      createdAt: Date;
      updatedAt: Date;
    },
    price: any, // Prisma Decimal type - Product의 basePrice 사용
  ): ProductOption {
    return new ProductOption(
      Number(option.productOptionId),
      Number(option.productId),
      option.optionName,
      option.sku,
      Number(price),
      option.stockQuantity,
      option.createdAt,
      option.updatedAt,
    );
  }
}
