import { DiscountType as PrismaDiscountType, Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@/common/exceptions';
import { CouponQuantity } from '@/domain/coupon/coupon-quantity.vo';
import { Coupon } from '@/domain/coupon/coupon.entity';
import { CouponRepository } from '@/domain/coupon/coupon.repository';
import { DiscountType } from '@/domain/coupon/discount-type.vo';
import { DiscountValue } from '@/domain/coupon/discount-value.vo';
import { UserCoupon } from '@/domain/coupon/user-coupon.entity';
import { ValidityPeriod } from '@/domain/coupon/validity-period.vo';
import { Point } from '@/domain/point/point.vo';
import { PrismaProvider } from './prisma-provider.service';

@Injectable()
export class PrismaCouponRepository implements CouponRepository {
  constructor(private readonly prismaProvider: PrismaProvider) {}

  async findCouponById(id: number): Promise<Coupon | null> {
    const prisma = this.prismaProvider.get();
    const coupon = await prisma.coupon.findUnique({
      where: { couponId: BigInt(id) },
    });

    if (!coupon) {
      return null;
    }

    return this.toCoupon(coupon);
  }

  async findAvailableCoupons(at: Date): Promise<Coupon[]> {
    const prisma = this.prismaProvider.get();
    const coupons = await prisma.coupon.findMany({
      where: {
        validFrom: {
          lte: at,
        },
        validUntil: {
          gte: at,
        },
      },
    });

    return coupons
      .filter((coupon) => coupon.issuedQuantity < coupon.totalQuantity)
      .map((coupon) => this.toCoupon(coupon));
  }

  async saveCoupon(coupon: Coupon): Promise<void> {
    const prisma = this.prismaProvider.get();
    const couponId = coupon.getId();

    if (couponId) {
      // Update existing coupon
      await prisma.coupon.update({
        where: { couponId: BigInt(couponId) },
        data: {
          couponName: coupon.getName(),
          discountType: this.toPrismaDiscountType(coupon.getDiscountValue().getType()) as PrismaDiscountType,
          discountValue: coupon.getDiscountValue().getValue(),
          maxDiscountAmount: coupon.getMaxDiscountAmount()?.getValue() ?? null,
          minOrderAmount: coupon.getMinOrderAmount().getValue(),
          totalQuantity: coupon.getQuantity().getTotalQuantity(),
          issuedQuantity: coupon.getQuantity().getIssuedQuantity(),
          validFrom: coupon.getValidityPeriod().getFrom(),
          validUntil: coupon.getValidityPeriod().getUntil(),
          updatedAt: coupon.getUpdatedAt(),
        },
      });
    } else {
      // Create new coupon
      await prisma.coupon.create({
        data: {
          couponName: coupon.getName(),
          discountType: this.toPrismaDiscountType(coupon.getDiscountValue().getType()) as PrismaDiscountType,
          discountValue: coupon.getDiscountValue().getValue(),
          maxDiscountAmount: coupon.getMaxDiscountAmount()?.getValue() ?? null,
          minOrderAmount: coupon.getMinOrderAmount().getValue(),
          totalQuantity: coupon.getQuantity().getTotalQuantity(),
          issuedQuantity: coupon.getQuantity().getIssuedQuantity(),
          validFrom: coupon.getValidityPeriod().getFrom(),
          validUntil: coupon.getValidityPeriod().getUntil(),
          createdAt: coupon.getCreatedAt(),
          updatedAt: coupon.getUpdatedAt(),
        },
      });
    }
  }

  async findCouponByIdWithLock(id: number): Promise<Coupon | null> {
    const prisma = this.prismaProvider.get();
    const result = await prisma.$queryRaw<
      Array<{
        couponId: bigint;
        couponName: string;
        discountType: string;
        discountValue: any;
        maxDiscountAmount: unknown;
        minOrderAmount: any;
        totalQuantity: number;
        issuedQuantity: number;
        validFrom: Date;
        validUntil: Date;
        createdAt: Date;
        updatedAt: Date;
      }>
    >`
      SELECT 
        coupon_id AS couponId,
        coupon_name AS couponName,
        discount_type AS discountType,
        discount_value AS discountValue,
        max_discount_amount AS maxDiscountAmount,
        min_order_amount AS minOrderAmount,
        total_quantity AS totalQuantity,
        issued_quantity AS issuedQuantity,
        valid_from AS validFrom,
        valid_until AS validUntil,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM coupons 
      WHERE coupon_id = ${BigInt(id)} 
      FOR UPDATE
    `;

    if (result.length === 0) {
      return null;
    }

    return this.toCoupon(result[0]);
  }

  async findCouponByIdWithLockOrElseThrow(id: number): Promise<Coupon> {
    const coupon = await this.findCouponByIdWithLock(id);

    if (!coupon) {
      throw new NotFoundException(`쿠폰을 찾을 수 없습니다. couponId: ${id}`);
    }

    return coupon;
  }

  async findUserCouponById(id: number): Promise<UserCoupon | null> {
    const prisma = this.prismaProvider.get();
    const userCoupon = await prisma.userCoupon.findUnique({
      where: { userCouponId: BigInt(id) },
      include: {
        coupon: true,
      },
    });

    if (!userCoupon) {
      return null;
    }

    return this.toUserCoupon(userCoupon);
  }

  async findUserCouponByIdOrElseThrow(id: number): Promise<UserCoupon> {
    const userCoupon = await this.findUserCouponById(id);

    if (!userCoupon) {
      throw new NotFoundException(`사용자 쿠폰을 찾을 수 없습니다. userCouponId: ${id}`);
    }

    return userCoupon;
  }

  async findCouponByUserCouponIdOrElseThrow(userCouponId: number): Promise<Coupon> {
    const prisma = this.prismaProvider.get();
    const userCoupon = await prisma.userCoupon.findUnique({
      where: { userCouponId: BigInt(userCouponId) },
      include: {
        coupon: true,
      },
    });

    if (!userCoupon) {
      throw new NotFoundException(`사용자 쿠폰을 찾을 수 없습니다. userCouponId: ${userCouponId}`);
    }

    return this.toCoupon(userCoupon.coupon);
  }

  async findUserCouponsByUserId(userId: number): Promise<UserCoupon[]> {
    const prisma = this.prismaProvider.get();
    const userCoupons = await prisma.userCoupon.findMany({
      where: { userId: BigInt(userId) },
      include: {
        coupon: true,
      },
      orderBy: {
        issuedAt: 'desc',
      },
    });

    return userCoupons.map((userCoupon) => this.toUserCoupon(userCoupon));
  }

  async findAvailableUserCouponsByUserId(userId: number, at: Date): Promise<UserCoupon[]> {
    const prisma = this.prismaProvider.get();
    const userCoupons = await prisma.userCoupon.findMany({
      where: {
        userId: BigInt(userId),
        usedAt: null,
        expiresAt: {
          gte: at,
        },
      },
      include: {
        coupon: true,
      },
      orderBy: {
        issuedAt: 'desc',
      },
    });

    return userCoupons.map((userCoupon) => this.toUserCoupon(userCoupon));
  }

  async existsUserCouponByCouponIdAndUserId(couponId: number, userId: number): Promise<boolean> {
    const prisma = this.prismaProvider.get();
    const count = await prisma.userCoupon.count({
      where: {
        couponId: BigInt(couponId),
        userId: BigInt(userId),
      },
    });

    return count > 0;
  }

  async saveUserCoupon(userCoupon: UserCoupon): Promise<void> {
    const prisma = this.prismaProvider.get();
    const userCouponId = userCoupon.getId();

    if (userCouponId) {
      // Update existing user coupon
      await prisma.userCoupon.update({
        where: { userCouponId: BigInt(userCouponId) },
        data: {
          userId: BigInt(userCoupon.getUserId()),
          couponId: BigInt(userCoupon.getCoupon().getId()!),
          orderId: userCoupon.getOrderId() ? BigInt(userCoupon.getOrderId()!) : null,
          issuedAt: userCoupon.getIssuedAt(),
          expiresAt: userCoupon.getValidityPeriod().getUntil(),
          usedAt: userCoupon.getUsedAt(),
        },
      });
    } else {
      // Create new user coupon
      await prisma.userCoupon.create({
        data: {
          userId: BigInt(userCoupon.getUserId()),
          couponId: BigInt(userCoupon.getCoupon().getId()!),
          orderId: userCoupon.getOrderId() ? BigInt(userCoupon.getOrderId()!) : null,
          issuedAt: userCoupon.getIssuedAt(),
          expiresAt: userCoupon.getValidityPeriod().getUntil(),
          usedAt: userCoupon.getUsedAt(),
        },
      });
    }
  }

  private toCoupon(coupon: {
    couponId: bigint;
    couponName: string;
    discountType: string;
    discountValue: any; // Prisma Decimal type
    maxDiscountAmount: unknown; // Prisma Decimal type or null
    minOrderAmount: any; // Prisma Decimal type
    totalQuantity: number;
    issuedQuantity: number;
    validFrom: Date;
    validUntil: Date;
    createdAt: Date;
    updatedAt: Date;
  }): Coupon {
    const discountType = this.fromPrismaDiscountType(coupon.discountType);
    // Prisma Decimal을 안전하게 number로 변환
    let discountValueNum: number;
    if (typeof coupon.discountValue === 'object' && coupon.discountValue !== null) {
      // Prisma Decimal 객체인 경우
      if (typeof coupon.discountValue.toNumber === 'function') {
        discountValueNum = coupon.discountValue.toNumber();
      } else {
        const strValue = coupon.discountValue.toString();
        discountValueNum = parseFloat(strValue);
      }
    } else {
      discountValueNum = Number(coupon.discountValue);
    }

    // PERCENTAGE 타입인 경우 소수점 값도 허용하므로 정수 변환 불필요
    // FIXED 타입인 경우에만 정수로 변환
    if (discountType === DiscountType.FIXED && !Number.isInteger(discountValueNum)) {
      discountValueNum = Math.round(discountValueNum);
    }

    const discountValue = new DiscountValue(discountType, discountValueNum);
    const maxDiscountAmount = coupon.maxDiscountAmount
      ? new Point(
          typeof coupon.maxDiscountAmount === 'object' && coupon.maxDiscountAmount !== null
            ? Number(
                'toNumber' in coupon.maxDiscountAmount &&
                  typeof (coupon.maxDiscountAmount as Prisma.Decimal).toNumber === 'function'
                  ? (coupon.maxDiscountAmount as Prisma.Decimal).toNumber()
                  : Number(coupon.maxDiscountAmount),
              )
            : Number(coupon.maxDiscountAmount),
        )
      : null;
    const minOrderAmount = new Point(
      typeof coupon.minOrderAmount === 'object' && coupon.minOrderAmount !== null
        ? Number(coupon.minOrderAmount.toString())
        : Number(coupon.minOrderAmount),
    );
    const quantity = new CouponQuantity(coupon.totalQuantity, coupon.issuedQuantity);
    const validityPeriod = new ValidityPeriod(coupon.validFrom, coupon.validUntil);

    return new Coupon(
      coupon.couponName,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      quantity,
      validityPeriod,
      coupon.createdAt,
      coupon.updatedAt,
      Number(coupon.couponId),
    );
  }

  private toUserCoupon(userCoupon: {
    userCouponId: bigint;
    userId: bigint;
    couponId: bigint;
    orderId: bigint | null;
    issuedAt: Date;
    expiresAt: Date;
    usedAt: Date | null;
    coupon: {
      couponId: bigint;
      couponName: string;
      discountType: string;
      discountValue: any;
      maxDiscountAmount: unknown;
      minOrderAmount: any;
      totalQuantity: number;
      issuedQuantity: number;
      validFrom: Date;
      validUntil: Date;
      createdAt: Date;
      updatedAt: Date;
    };
  }): UserCoupon {
    const coupon = this.toCoupon(userCoupon.coupon);
    const validityPeriod = new ValidityPeriod(userCoupon.issuedAt, userCoupon.expiresAt);

    return new UserCoupon(
      Number(userCoupon.userId),
      coupon,
      userCoupon.issuedAt,
      validityPeriod,
      userCoupon.usedAt,
      userCoupon.orderId ? Number(userCoupon.orderId) : null,
      Number(userCoupon.userCouponId),
    );
  }

  private toPrismaDiscountType(discountType: DiscountType): string {
    return discountType === DiscountType.PERCENTAGE ? 'PERCENTAGE' : 'FIXED_AMOUNT';
  }

  private fromPrismaDiscountType(discountType: string): DiscountType {
    if (discountType === 'PERCENTAGE') {
      return DiscountType.PERCENTAGE;
    } else if (discountType === 'FIXED_AMOUNT') {
      return DiscountType.FIXED;
    } else {
      // 기본값으로 FIXED 반환 (하지만 이 경우는 에러가 발생해야 함)
      throw new Error(`Unknown discount type: ${discountType}`);
    }
  }
}
