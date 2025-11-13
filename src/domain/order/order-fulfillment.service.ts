import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@/common/exceptions';
import { UserCoupon } from '@/domain/coupon/user-coupon.entity';
import { PointBalance } from '@/domain/point/point-balance.entity';
import { PointTransaction } from '@/domain/point/point-transaction.entity';
import { Point } from '@/domain/point/point.vo';
import { Order } from './order.entity';
import type { ProductDetail } from '@/domain/product/product-detail.vo';

export interface FulfillmentResult {
  order: Order;
  pointTransaction: PointTransaction;
  updatedCoupon: UserCoupon | null;
  updatedBalance: PointBalance;
}

@Injectable()
export class OrderFulfillmentService {
  fulfill(params: {
    userId: number;
    productDetails: Array<{ detail: ProductDetail; quantity: number }>;
    userCoupon: UserCoupon | null;
    pointBalance: PointBalance;
  }): FulfillmentResult {
    const { userId, productDetails, userCoupon, pointBalance } = params;

    if (userCoupon) {
      const totalPrice = productDetails.reduce((sum, { detail, quantity }) => sum + detail.getPrice() * quantity, 0);

      const minOrderAmount = userCoupon.getCoupon().getMinOrderAmount();
      const canUse = userCoupon.canUse(new Date(), new Point(totalPrice), minOrderAmount);

      if (!canUse) {
        throw new BadRequestException('사용할 수 없는 쿠폰입니다.');
      }
    }

    const order = Order.create({
      userId,
      productDetails,
      userCoupon,
    });

    const finalPrice = order.getFinalPrice();
    pointBalance.use(new Point(finalPrice));

    const pointTransaction = PointTransaction.use(userId, finalPrice, pointBalance.getBalance().getValue());

    return {
      order,
      pointTransaction,
      updatedCoupon: userCoupon,
      updatedBalance: pointBalance,
    };
  }
}
