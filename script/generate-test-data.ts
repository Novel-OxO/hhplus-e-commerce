/**
 * 대용량 테스트 데이터 생성 스크립트
 * 각 테이블별로 30만 개의 레코드를 생성합니다.
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// 설정
const RECORDS_PER_TABLE = 300_000;
const BATCH_SIZE = 1000; // 한 번에 삽입할 레코드 수

/**
 * 사용자 데이터 생성
 */
async function generateUsers(startId = 31, count = RECORDS_PER_TABLE) {
  console.log(`사용자 데이터 생성 중... (${count.toLocaleString()}개)`);

  const baseDate = new Date('2025-01-01T09:00:00.000Z');

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, count - i);
    const users: Prisma.UserCreateManyInput[] = [];

    for (let j = 0; j < batchSize; j++) {
      const userId = startId + i + j;
      const createdAt = new Date(baseDate.getTime() + userId * 10_000);
      const updatedAt = new Date(createdAt.getTime() + 9 * 24 * 60 * 60 * 1000);

      users.push({
        userId: BigInt(userId),
        name: `User ${userId}`,
        email: `user${userId}@example.com`,
        createdAt: createdAt,
        updatedAt: updatedAt,
      });
    }

    await prisma.user.createMany({
      data: users,
      skipDuplicates: true,
    });

    if ((i + batchSize) % 10_000 === 0) {
      console.log(`  진행: ${(i + batchSize).toLocaleString()}/${count.toLocaleString()}`);
    }
  }

  console.log('✓ 사용자 데이터 생성 완료');
}

/**
 * 상품 데이터 생성
 */
async function generateProducts(startId = 31, count = RECORDS_PER_TABLE) {
  console.log(`상품 데이터 생성 중... (${count.toLocaleString()}개)`);

  const baseDate = new Date('2025-01-03T10:00:00.000Z');

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, count - i);
    const products: Prisma.ProductCreateManyInput[] = [];

    for (let j = 0; j < batchSize; j++) {
      const productId = startId + i + j;
      const createdAt = new Date(baseDate.getTime() + productId * 10_000);
      const updatedAt = new Date(createdAt.getTime() + 9 * 24 * 60 * 60 * 1000);

      products.push({
        productId: BigInt(productId),
        productName: `Product ${productId}`,
        description: `Description for product ${productId}`,
        basePrice: new Prisma.Decimal(10_000 + productId * 50),
        createdAt: createdAt,
        updatedAt: updatedAt,
      });
    }

    await prisma.product.createMany({
      data: products,
      skipDuplicates: true,
    });

    if ((i + batchSize) % 10_000 === 0) {
      console.log(`  진행: ${(i + batchSize).toLocaleString()}/${count.toLocaleString()}`);
    }
  }

  console.log('✓ 상품 데이터 생성 완료');
}

/**
 * 상품 옵션 데이터 생성
 */
async function generateProductOptions(startId = 31, count = RECORDS_PER_TABLE) {
  console.log(`상품 옵션 데이터 생성 중... (${count.toLocaleString()}개)`);

  const baseDate = new Date('2025-01-04T11:00:00.000Z');

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, count - i);
    const options: Prisma.ProductOptionCreateManyInput[] = [];

    for (let j = 0; j < batchSize; j++) {
      const optionId = startId + i + j;
      const productId = startId + i + j; // 1:1 매핑
      const createdAt = new Date(baseDate.getTime() + optionId * 10_000);
      const updatedAt = new Date(createdAt.getTime() + 9 * 24 * 60 * 60 * 1000);

      options.push({
        productOptionId: BigInt(optionId),
        productId: BigInt(productId),
        optionName: `Default Option ${optionId}`,
        sku: `SKU-${optionId.toString().padStart(6, '0')}`,
        stockQuantity: 50 + (optionId % 50),
        createdAt: createdAt,
        updatedAt: updatedAt,
      });
    }

    await prisma.productOption.createMany({
      data: options,
      skipDuplicates: true,
    });

    if ((i + batchSize) % 10_000 === 0) {
      console.log(`  진행: ${(i + batchSize).toLocaleString()}/${count.toLocaleString()}`);
    }
  }

  console.log('✓ 상품 옵션 데이터 생성 완료');
}

/**
 * 상품 조회 로그 데이터 생성
 */
async function generateProductViewLogs(startId = 31, count = RECORDS_PER_TABLE, maxUserId = 300_030) {
  console.log(`상품 조회 로그 데이터 생성 중... (${count.toLocaleString()}개)`);

  const baseDate = new Date('2025-02-01T12:00:30.000Z');

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, count - i);
    const logs: Prisma.ProductViewLogCreateManyInput[] = [];

    for (let j = 0; j < batchSize; j++) {
      const logId = startId + i + j;
      const productId = 1 + ((logId - 1) % 300_030);
      const userId = Math.random() < 0.2 ? null : BigInt(1 + (logId % maxUserId));
      const viewedAt = new Date(baseDate.getTime() + logId * 30_000);

      logs.push({
        logId: BigInt(logId),
        productId: BigInt(productId),
        userId: userId,
        viewedAt: viewedAt,
      });
    }

    await prisma.productViewLog.createMany({
      data: logs,
      skipDuplicates: true,
    });

    if ((i + batchSize) % 10_000 === 0) {
      console.log(`  진행: ${(i + batchSize).toLocaleString()}/${count.toLocaleString()}`);
    }
  }

  console.log('✓ 상품 조회 로그 데이터 생성 완료');
}

/**
 * 상품 랭킹 데이터 생성
 */
async function generateProductRankings(count = RECORDS_PER_TABLE) {
  console.log(`상품 랭킹 데이터 생성 중... (${count.toLocaleString()}개)`);

  const calculatedAt = new Date('2025-02-15');

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, count - i);
    const rankings: Prisma.ProductRankingCreateManyInput[] = [];

    for (let j = 0; j < batchSize; j++) {
      const productId = 1 + i + j;
      const totalViews = 300 + productId * 5;
      const rankingPosition = productId;

      rankings.push({
        productId: BigInt(productId),
        totalViews: totalViews,
        rankingPosition: rankingPosition,
        calculatedAt: calculatedAt,
      });
    }

    await prisma.productRanking.createMany({
      data: rankings,
      skipDuplicates: true,
    });

    if ((i + batchSize) % 10_000 === 0) {
      console.log(`  진행: ${(i + batchSize).toLocaleString()}/${count.toLocaleString()}`);
    }
  }

  console.log('✓ 상품 랭킹 데이터 생성 완료');
}

/**
 * 장바구니 아이템 데이터 생성
 */
async function generateCartItems(startId = 31, count = RECORDS_PER_TABLE, maxUserId = 300_030, maxOptionId = 300_030) {
  console.log(`장바구니 아이템 데이터 생성 중... (${count.toLocaleString()}개)`);

  const baseDate = new Date('2025-02-05T14:00:00.000Z');

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, count - i);
    const items: Prisma.CartItemCreateManyInput[] = [];

    for (let j = 0; j < batchSize; j++) {
      const cartItemId = startId + i + j;
      const userId = 1 + (cartItemId % maxUserId);
      const productOptionId = 1 + (cartItemId % maxOptionId);
      const quantity = 1 + (cartItemId % 5);
      const price = new Prisma.Decimal(20_000 + cartItemId * 10);
      const createdAt = new Date(baseDate.getTime() + cartItemId * 10_000);
      const updatedAt = new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000);

      items.push({
        cartItemId: BigInt(cartItemId),
        userId: BigInt(userId),
        productOptionId: BigInt(productOptionId),
        quantity: quantity,
        price: price,
        createdAt: createdAt,
        updatedAt: updatedAt,
      });
    }

    await prisma.cartItem.createMany({
      data: items,
      skipDuplicates: true,
    });

    if ((i + batchSize) % 10_000 === 0) {
      console.log(`  진행: ${(i + batchSize).toLocaleString()}/${count.toLocaleString()}`);
    }
  }

  console.log('✓ 장바구니 아이템 데이터 생성 완료');
}

/**
 * 쿠폰 데이터 생성
 */
async function generateCoupons(startId = 31, count = RECORDS_PER_TABLE) {
  console.log(`쿠폰 데이터 생성 중... (${count.toLocaleString()}개)`);

  const createdAt = new Date('2024-12-01T08:00:00.000Z');
  const updatedAt = new Date('2024-12-20T08:00:00.000Z');
  const validFrom = new Date('2025-01-01T00:00:00.000Z');
  const validUntil = new Date('2025-12-31T23:59:59.000Z');

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, count - i);
    const coupons: Prisma.CouponCreateManyInput[] = [];

    for (let j = 0; j < batchSize; j++) {
      const couponId = startId + i + j;
      const discountType = couponId % 2 === 1 ? 'PERCENTAGE' : 'FIXED_AMOUNT';

      let discountValue: Prisma.Decimal;
      let maxDiscountAmount: Prisma.Decimal | null;

      if (discountType === 'PERCENTAGE') {
        discountValue = new Prisma.Decimal(5 + (couponId % 30) * 2);
        maxDiscountAmount = new Prisma.Decimal(15_000);
      } else {
        discountValue = new Prisma.Decimal(2_000 + (couponId % 30) * 200);
        maxDiscountAmount = null;
      }

      const minOrderAmount = new Prisma.Decimal(30_000 + couponId * 50);
      const totalQuantity = 100 + (couponId % 50);
      const issuedQuantity = 20 + (couponId % 40);

      coupons.push({
        couponId: BigInt(couponId),
        couponName: `Coupon ${couponId}`,
        discountType: discountType,
        discountValue: discountValue,
        maxDiscountAmount: maxDiscountAmount,
        minOrderAmount: minOrderAmount,
        totalQuantity: totalQuantity,
        issuedQuantity: issuedQuantity,
        validFrom: validFrom,
        validUntil: validUntil,
        createdAt: createdAt,
        updatedAt: updatedAt,
      });
    }

    await prisma.coupon.createMany({
      data: coupons,
      skipDuplicates: true,
    });

    if ((i + batchSize) % 10_000 === 0) {
      console.log(`  진행: ${(i + batchSize).toLocaleString()}/${count.toLocaleString()}`);
    }
  }

  console.log('✓ 쿠폰 데이터 생성 완료');
}

/**
 * 사용자 쿠폰 데이터 생성
 */
async function generateUserCoupons(
  startId = 31,
  count = RECORDS_PER_TABLE,
  maxUserId = 300_030,
  maxCouponId = 300_030,
) {
  console.log(`사용자 쿠폰 데이터 생성 중... (${count.toLocaleString()}개)`);

  const issuedAt = new Date('2025-01-20T09:00:00.000Z');
  const expiresAt = new Date('2025-06-30T23:59:59.000Z');

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, count - i);
    const userCoupons: Prisma.UserCouponCreateManyInput[] = [];

    for (let j = 0; j < batchSize; j++) {
      const userCouponId = startId + i + j;
      const userId = 1 + (userCouponId % maxUserId);
      const couponId = 1 + (userCouponId % maxCouponId);
      const orderId = userCouponId; // 1:1 매핑
      const usedAt = new Date(issuedAt.getTime() + (21 * 24 + 6) * 60 * 60 * 1000 + userCouponId * 10_000);

      userCoupons.push({
        userCouponId: BigInt(userCouponId),
        userId: BigInt(userId),
        couponId: BigInt(couponId),
        orderId: BigInt(orderId),
        issuedAt: issuedAt,
        expiresAt: expiresAt,
        usedAt: usedAt,
      });
    }

    await prisma.userCoupon.createMany({
      data: userCoupons,
      skipDuplicates: true,
    });

    if ((i + batchSize) % 10_000 === 0) {
      console.log(`  진행: ${(i + batchSize).toLocaleString()}/${count.toLocaleString()}`);
    }
  }

  console.log('✓ 사용자 쿠폰 데이터 생성 완료');
}

/**
 * 주문 데이터 생성
 */
async function generateOrders(startId = 31, count = RECORDS_PER_TABLE, maxUserId = 300_030) {
  console.log(`주문 데이터 생성 중... (${count.toLocaleString()}개)`);

  const createdAt = new Date('2025-02-10T11:00:00.000Z');

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, count - i);
    const orders: Prisma.OrderCreateManyInput[] = [];

    for (let j = 0; j < batchSize; j++) {
      const orderId = startId + i + j;
      const userId = 1 + (orderId % maxUserId);
      const userCouponId = orderId; // 1:1 매핑

      const rand = orderId % 10;
      let orderStatus: 'PENDING' | 'COMPLETED' | 'CANCELLED';
      let completedAt: Date | null;
      let cancelledAt: Date | null;

      if (rand < 6) {
        orderStatus = 'COMPLETED';
        completedAt = new Date(createdAt.getTime() + (5 * 24 + 7) * 60 * 60 * 1000 + orderId * 10_000);
        cancelledAt = null;
      } else if (rand < 8) {
        orderStatus = 'PENDING';
        completedAt = null;
        cancelledAt = null;
      } else {
        orderStatus = 'CANCELLED';
        completedAt = null;
        cancelledAt = new Date(createdAt.getTime() + (6 * 24 + 7) * 60 * 60 * 1000 + orderId * 10_000);
      }

      const totalPrice = new Prisma.Decimal(70_000 + orderId * 50);
      const discountPrice = new Prisma.Decimal(1_200 + (orderId % 100) * 10);
      const finalPrice = new Prisma.Decimal(totalPrice.toNumber() - discountPrice.toNumber());
      const updatedAt = new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000 + orderId * 10_000);

      orders.push({
        orderId: BigInt(orderId),
        userId: BigInt(userId),
        userCouponId: BigInt(userCouponId),
        orderStatus: orderStatus,
        totalPrice: totalPrice,
        discountPrice: discountPrice,
        finalPrice: finalPrice,
        createdAt: createdAt,
        updatedAt: updatedAt,
        completedAt: completedAt,
        cancelledAt: cancelledAt,
      });
    }

    await prisma.order.createMany({
      data: orders,
      skipDuplicates: true,
    });

    if ((i + batchSize) % 10_000 === 0) {
      console.log(`  진행: ${(i + batchSize).toLocaleString()}/${count.toLocaleString()}`);
    }
  }

  console.log('✓ 주문 데이터 생성 완료');
}

/**
 * 주문 아이템 데이터 생성
 */
async function generateOrderItems(startId = 31, count = RECORDS_PER_TABLE, maxOptionId = 300_030) {
  console.log(`주문 아이템 데이터 생성 중... (${count.toLocaleString()}개)`);

  const createdAt = new Date('2025-02-10T12:00:00.000Z');

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, count - i);
    const items: Prisma.OrderItemCreateManyInput[] = [];

    for (let j = 0; j < batchSize; j++) {
      const orderItemId = startId + i + j;
      const orderId = startId + i + j; // 1:1 매핑
      const productOptionId = 1 + (orderItemId % maxOptionId);
      const price = new Prisma.Decimal(22_000 + orderItemId * 12);
      const quantity = 1 + (orderItemId % 3);
      const subtotal = new Prisma.Decimal(price.toNumber() * quantity);

      items.push({
        orderItemId: BigInt(orderItemId),
        orderId: BigInt(orderId),
        productOptionId: BigInt(productOptionId),
        productName: `Product ${productOptionId}`,
        optionName: `Default Option ${productOptionId}`,
        sku: `SKU-${productOptionId.toString().padStart(6, '0')}`,
        price: price,
        quantity: quantity,
        subtotal: subtotal,
        createdAt: createdAt,
      });
    }

    await prisma.orderItem.createMany({
      data: items,
      skipDuplicates: true,
    });

    if ((i + batchSize) % 10_000 === 0) {
      console.log(`  진행: ${(i + batchSize).toLocaleString()}/${count.toLocaleString()}`);
    }
  }

  console.log('✓ 주문 아이템 데이터 생성 완료');
}

/**
 * 쿠폰 사용 히스토리 데이터 생성
 */
async function generateCouponUsageHistory(startId = 31, count = RECORDS_PER_TABLE) {
  console.log(`쿠폰 사용 히스토리 데이터 생성 중... (${count.toLocaleString()}개)`);

  const usedAt = new Date('2025-02-12T17:00:00.000Z');

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, count - i);
    const histories: Prisma.CouponUsageHistoryCreateManyInput[] = [];

    for (let j = 0; j < batchSize; j++) {
      const usageId = startId + i + j;
      const userCouponId = startId + i + j; // 1:1 매핑
      const orderId = startId + i + j; // 1:1 매핑
      const discountPrice = new Prisma.Decimal(1_200 + (usageId % 100) * 10);
      const status: 'USED' | 'CANCELLED' = usageId % 10 < 7 ? 'USED' : 'CANCELLED';

      histories.push({
        usageId: BigInt(usageId),
        userCouponId: BigInt(userCouponId),
        orderId: BigInt(orderId),
        discountPrice: discountPrice,
        status: status,
        usedAt: usedAt,
      });
    }

    await prisma.couponUsageHistory.createMany({
      data: histories,
      skipDuplicates: true,
    });

    if ((i + batchSize) % 10_000 === 0) {
      console.log(`  진행: ${(i + batchSize).toLocaleString()}/${count.toLocaleString()}`);
    }
  }

  console.log('✓ 쿠폰 사용 히스토리 데이터 생성 완료');
}

/**
 * 포인트 잔액 데이터 생성
 */
async function generatePointBalances(startId = 31, count = RECORDS_PER_TABLE) {
  console.log(`포인트 잔액 데이터 생성 중... (${count.toLocaleString()}개)`);

  const updatedAt = new Date('2025-02-01T09:00:00.000Z');

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, count - i);
    const balances: Prisma.PointBalanceCreateManyInput[] = [];

    for (let j = 0; j < batchSize; j++) {
      const userId = startId + i + j;
      const balance = new Prisma.Decimal(50_000 - (userId % 1_000) * 10);

      balances.push({
        userId: BigInt(userId),
        balance: balance,
        updatedAt: updatedAt,
      });
    }

    await prisma.pointBalance.createMany({
      data: balances,
      skipDuplicates: true,
    });

    if ((i + batchSize) % 10_000 === 0) {
      console.log(`  진행: ${(i + batchSize).toLocaleString()}/${count.toLocaleString()}`);
    }
  }

  console.log('✓ 포인트 잔액 데이터 생성 완료');
}

/**
 * 포인트 충전 요청 데이터 생성
 */
async function generatePointChargeRequests(startId = 31, count = RECORDS_PER_TABLE, maxUserId = 300_030) {
  console.log(`포인트 충전 요청 데이터 생성 중... (${count.toLocaleString()}개)`);

  const createdAt = new Date('2025-02-05T09:00:00.000Z');

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, count - i);
    const requests: Prisma.PointChargeRequestCreateManyInput[] = [];

    for (let j = 0; j < batchSize; j++) {
      const chargeRequestId = startId + i + j;
      const userId = 1 + (chargeRequestId % maxUserId);
      const amount = new Prisma.Decimal(30_000 + (chargeRequestId % 100) * 50);

      const rand = chargeRequestId % 10;
      let status: 'PENDING' | 'COMPLETED' | 'FAILED';
      let completedAt: Date | null;

      if (rand < 4) {
        status = 'PENDING';
        completedAt = null;
      } else if (rand < 8) {
        status = 'COMPLETED';
        completedAt = new Date(createdAt.getTime() + 6 * 60 * 60 * 1000 + chargeRequestId * 10_000);
      } else {
        status = 'FAILED';
        completedAt = new Date(createdAt.getTime() + 7 * 60 * 60 * 1000 + chargeRequestId * 10_000);
      }

      requests.push({
        chargeRequestId: BigInt(chargeRequestId),
        userId: BigInt(userId),
        amount: amount,
        status: status,
        createdAt: createdAt,
        completedAt: completedAt,
      });
    }

    await prisma.pointChargeRequest.createMany({
      data: requests,
      skipDuplicates: true,
    });

    if ((i + batchSize) % 10_000 === 0) {
      console.log(`  진행: ${(i + batchSize).toLocaleString()}/${count.toLocaleString()}`);
    }
  }

  console.log('✓ 포인트 충전 요청 데이터 생성 완료');
}

/**
 * 결제 데이터 생성
 */
async function generatePayments(startId = 31, count = RECORDS_PER_TABLE) {
  console.log(`결제 데이터 생성 중... (${count.toLocaleString()}개)`);

  const createdAt = new Date('2025-02-05T14:00:00.000Z');
  const updatedAt = new Date('2025-02-05T18:00:00.000Z');

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, count - i);
    const payments: Prisma.PaymentCreateManyInput[] = [];

    for (let j = 0; j < batchSize; j++) {
      const paymentId = startId + i + j;
      const chargeRequestId = startId + i + j; // 1:1 매핑
      const pgPaymentId = `PGPAY-${paymentId.toString().padStart(8, '0')}`;
      const amount = new Prisma.Decimal(30_000 + (paymentId % 100) * 50);

      const rand = paymentId % 10;
      let paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
      let paidAt: Date | null;

      if (rand < 4) {
        paymentStatus = 'PENDING';
        paidAt = null;
      } else if (rand < 8) {
        paymentStatus = 'SUCCESS';
        paidAt = new Date(createdAt.getTime() + 1 * 60 * 60 * 1000 + paymentId * 10_000);
      } else {
        paymentStatus = 'FAILED';
        paidAt = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000 + paymentId * 10_000);
      }

      payments.push({
        paymentId: BigInt(paymentId),
        chargeRequestId: BigInt(chargeRequestId),
        pgPaymentId: pgPaymentId,
        paymentStatus: paymentStatus,
        amount: amount,
        paidAt: paidAt,
        createdAt: createdAt,
        updatedAt: updatedAt,
      });
    }

    await prisma.payment.createMany({
      data: payments,
      skipDuplicates: true,
    });

    if ((i + batchSize) % 10_000 === 0) {
      console.log(`  진행: ${(i + batchSize).toLocaleString()}/${count.toLocaleString()}`);
    }
  }

  console.log('✓ 결제 데이터 생성 완료');
}

/**
 * 포인트 거래 내역 데이터 생성
 */
async function generatePointTransactions(startId = 31, count = RECORDS_PER_TABLE, maxUserId = 300_030) {
  console.log(`포인트 거래 내역 데이터 생성 중... (${count.toLocaleString()}개)`);

  const createdAt = new Date('2025-02-06T09:00:00.000Z');

  for (let i = 0; i < count; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, count - i);
    const transactions: Prisma.PointTransactionCreateManyInput[] = [];

    for (let j = 0; j < batchSize; j++) {
      const transactionId = startId + i + j;
      const userId = 1 + (transactionId % maxUserId);

      const rand = transactionId % 10;
      let transactionType: 'CHARGE' | 'USE' | 'REFUND';
      let amount: Prisma.Decimal;
      let balanceAfter: Prisma.Decimal;
      const referenceId = BigInt(transactionId % 10_000);

      if (rand < 4) {
        transactionType = 'CHARGE';
        amount = new Prisma.Decimal(5_000 + (transactionId % 50) * 100);
        balanceAfter = new Prisma.Decimal(40_000 + amount.toNumber());
      } else if (rand < 8) {
        transactionType = 'USE';
        amount = new Prisma.Decimal(2_000 + (transactionId % 50) * 50);
        balanceAfter = new Prisma.Decimal(35_000 - amount.toNumber());
      } else {
        transactionType = 'REFUND';
        amount = new Prisma.Decimal(1_500 + (transactionId % 50) * 30);
        balanceAfter = new Prisma.Decimal(32_000 + amount.toNumber());
      }

      transactions.push({
        transactionId: BigInt(transactionId),
        userId: BigInt(userId),
        transactionType: transactionType,
        amount: amount,
        balanceAfter: balanceAfter,
        referenceId: referenceId,
        createdAt: createdAt,
      });
    }

    await prisma.pointTransaction.createMany({
      data: transactions,
      skipDuplicates: true,
    });

    if ((i + batchSize) % 10_000 === 0) {
      console.log(`  진행: ${(i + batchSize).toLocaleString()}/${count.toLocaleString()}`);
    }
  }

  console.log('✓ 포인트 거래 내역 데이터 생성 완료');
}

/**
 * 메인 함수
 */
async function main() {
  console.log('='.repeat(60));
  console.log('대용량 테스트 데이터 생성 시작');
  console.log(`테이블당 레코드 수: ${RECORDS_PER_TABLE.toLocaleString()}개`);
  console.log(`배치 크기: ${BATCH_SIZE.toLocaleString()}개`);
  console.log('='.repeat(60));
  console.log();

  const startTime = Date.now();

  try {
    // 각 테이블별 데이터 생성 (기존 30개 데이터가 있으므로 31부터 시작)
    await generateUsers(31, RECORDS_PER_TABLE);
    await generateProducts(31, RECORDS_PER_TABLE);
    await generateProductOptions(31, RECORDS_PER_TABLE);
    await generateProductViewLogs(31, RECORDS_PER_TABLE, 300_030);
    await generateProductRankings(RECORDS_PER_TABLE);
    await generateCartItems(31, RECORDS_PER_TABLE, 300_030, 300_030);
    await generateCoupons(31, RECORDS_PER_TABLE);
    await generateUserCoupons(31, RECORDS_PER_TABLE, 300_030, 300_030);
    await generateOrders(31, RECORDS_PER_TABLE, 300_030);
    await generateOrderItems(31, RECORDS_PER_TABLE, 300_030);
    await generateCouponUsageHistory(31, RECORDS_PER_TABLE);
    await generatePointBalances(31, RECORDS_PER_TABLE);
    await generatePointChargeRequests(31, RECORDS_PER_TABLE, 300_030);
    await generatePayments(31, RECORDS_PER_TABLE);
    await generatePointTransactions(31, RECORDS_PER_TABLE, 300_030);

    const endTime = Date.now();
    const elapsedSeconds = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    console.log();
    console.log('='.repeat(60));
    console.log('✓ 모든 테스트 데이터 생성 완료!');
    console.log(`소요 시간: ${minutes}분 ${seconds}초`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('✗ 오류 발생:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
main();
