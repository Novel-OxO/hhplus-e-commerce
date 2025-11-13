import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@/common/exceptions';
import { normalizeToDateOnly } from '@/common/utils/date.util';
import { ProductDetail } from '@/domain/product/product-detail.vo';
import { ProductOption } from '@/domain/product/product-option.entity';
import { ProductRanking } from '@/domain/product/product-ranking.entity';
import { ProductViewCount } from '@/domain/product/product-view-count.vo';
import { ProductViewLog } from '@/domain/product/product-view-log.entity';
import { ProductWithOptions } from '@/domain/product/product-with-options.vo';
import { Product } from '@/domain/product/product.entity';
import { ProductRepository } from '@/domain/product/product.repository';
import { PrismaProvider } from './prisma-provider.service';

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prismaProvider: PrismaProvider) {}

  async findByIdOrElseThrow(productId: number): Promise<Product> {
    const prisma = this.prismaProvider.get();
    const product = await prisma.product.findUnique({
      where: { productId: BigInt(productId) },
    });

    if (!product) {
      throw new NotFoundException(`상품을 찾을 수 없습니다. productId: ${productId}`);
    }

    return this.toProduct(product);
  }

  async findWithOptionsByProductIdOrElseThrow(productId: number): Promise<ProductWithOptions> {
    const prisma = this.prismaProvider.get();
    const product = await prisma.product.findUnique({
      where: { productId: BigInt(productId) },
      include: {
        productOptions: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`상품을 찾을 수 없습니다. productId: ${productId}`);
    }

    const productEntity = this.toProduct(product);
    const options = product.productOptions.map((option) => this.toProductOption(option, product.basePrice));

    return new ProductWithOptions(productEntity, options);
  }

  async findOptionByIdOrElseThrow(optionId: number): Promise<ProductOption> {
    const prisma = this.prismaProvider.get();
    const option = await prisma.productOption.findUnique({
      where: { productOptionId: BigInt(optionId) },
      include: {
        product: true,
      },
    });

    if (!option) {
      throw new NotFoundException(`상품 옵션을 찾을 수 없습니다. optionId: ${optionId}`);
    }

    return this.toProductOption(option, option.product.basePrice);
  }

  async findOptionByOptionIdAndProductIdOrElseThrow(optionId: number, productId: number): Promise<ProductOption> {
    const prisma = this.prismaProvider.get();
    const option = await prisma.productOption.findFirst({
      where: {
        productOptionId: BigInt(optionId),
        productId: BigInt(productId),
      },
      include: {
        product: true,
      },
    });

    if (!option) {
      throw new NotFoundException(`상품 옵션을 찾을 수 없습니다. optionId: ${optionId}, productId: ${productId}`);
    }

    return this.toProductOption(option, option.product.basePrice);
  }

  async findDetailsByOptionIds(optionIds: string[]): Promise<ProductDetail[]> {
    const prisma = this.prismaProvider.get();
    const numericOptionIds = optionIds.map((id) => BigInt(id));
    const options = await prisma.productOption.findMany({
      where: {
        productOptionId: {
          in: numericOptionIds,
        },
      },
      include: {
        product: true,
      },
    });

    return options.map((option) => {
      const productEntity = this.toProduct(option.product);
      const optionEntity = this.toProductOption(option, option.product.basePrice);
      return ProductDetail.from(productEntity, optionEntity);
    });
  }

  async saveViewLog(viewLog: ProductViewLog): Promise<ProductViewLog> {
    const prisma = this.prismaProvider.get();
    const saved = await prisma.productViewLog.create({
      data: {
        productId: BigInt(viewLog.getProductId()),
        userId: viewLog.getUserId() ? BigInt(viewLog.getUserId()!) : null,
        viewedAt: viewLog.getViewedAt(),
      },
    });

    return new ProductViewLog(
      Number(saved.productId),
      saved.userId ? Number(saved.userId) : undefined,
      saved.viewedAt,
      Number(saved.logId),
    );
  }

  async saveRanking(ranking: ProductRanking): Promise<ProductRanking> {
    const prisma = this.prismaProvider.get();
    const normalizedDate = normalizeToDateOnly(ranking.getCalculatedAt());
    const productId = BigInt(ranking.getProductId());
    const totalViews = BigInt(ranking.getTotalViews());
    const rankingPosition = ranking.getRankingPosition();

    try {
      await prisma.productRanking.update({
        where: {
          productId_calculatedAt: {
            productId,
            calculatedAt: normalizedDate,
          },
        },
        data: {
          totalViews,
          rankingPosition,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        await prisma.productRanking.create({
          data: {
            productId,
            totalViews,
            rankingPosition,
            calculatedAt: normalizedDate,
          },
        });
      } else {
        throw error;
      }
    }

    return ranking;
  }

  async aggregateViewsForDate(targetDate: Date): Promise<Array<ProductViewCount>> {
    const prisma = this.prismaProvider.get();
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const results = await prisma.productViewLog.groupBy({
      by: ['productId'],
      where: {
        viewedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        productId: true,
      },
    });

    return results.map((result) => ProductViewCount.create(Number(result.productId), result._count.productId));
  }

  async findRankingsByDate(targetDate: Date, limit: number): Promise<ProductRanking[]> {
    const prisma = this.prismaProvider.get();
    const normalizedDate = normalizeToDateOnly(targetDate);

    const rankings = await prisma.productRanking.findMany({
      where: {
        calculatedAt: normalizedDate,
      },
      orderBy: {
        rankingPosition: 'asc',
      },
      take: limit,
      include: {
        product: true,
      },
    });

    return rankings.map((ranking) => {
      const product = this.toProduct(ranking.product);
      return new ProductRanking(product, Number(ranking.totalViews), ranking.rankingPosition, ranking.calculatedAt);
    });
  }

  async findProductsByIds(productIds: number[]): Promise<Product[]> {
    const prisma = this.prismaProvider.get();
    const products = await prisma.product.findMany({
      where: {
        productId: {
          in: productIds.map((id) => BigInt(id)),
        },
      },
    });

    return products.map((product) => this.toProduct(product));
  }

  private toProduct(product: {
    productId: bigint;
    productName: string;
    description: string;
    basePrice: any; // Prisma Decimal type
    createdAt: Date;
    updatedAt: Date;
  }): Product {
    return new Product(
      Number(product.productId),
      product.productName,
      product.description,
      Number(product.basePrice),
      product.createdAt,
      product.updatedAt,
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
