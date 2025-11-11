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

/**
 * 주문 체결을 관리하는 도메인 서비스
 *
 * 책임:
 * - 주문 생성 시 여러 애그리거트(Order, ProductDetail, PointBalance, UserCoupon)의 일관성 보장
 * - 재고, 포인트, 쿠폰 등 필요한 자원을 원자적으로 확보
 * - 비즈니스 규칙 검증 (쿠폰 사용 가능 여부, 잔액 충분성 등)
 */
@Injectable()
export class OrderFulfillmentService {
  /**
   * 주문을 체결하고 필요한 모든 자원(재고, 포인트, 쿠폰)을 확보합니다.
   *
   * 처리 순서:
   * 1. 쿠폰 사용 가능 여부 검증
   * 2. 주문 생성 및 재고 차감
   * 3. 포인트 차감 및 거래 기록
   *
   * @param params.userId - 사용자 ID
   * @param params.productDetails - 주문할 상품 상세 정보 목록 (재고 차감 가능한 ProductDetail 객체)
   * @param params.userCoupon - 사용할 쿠폰 (선택)
   * @param params.pointBalance - 사용자 포인트 잔액
   * @returns 주문 체결 결과 (생성된 주문, 포인트 거래, 업데이트된 쿠폰 및 잔액)
   * @throws BadRequestException 쿠폰을 사용할 수 없는 경우
   */
  fulfill(params: {
    userId: number;
    productDetails: Array<{ detail: ProductDetail; quantity: number }>;
    userCoupon: UserCoupon | null;
    pointBalance: PointBalance;
  }): FulfillmentResult {
    const { userId, productDetails, userCoupon, pointBalance } = params;

    // 1. 쿠폰 사용 가능 여부 검증
    if (userCoupon) {
      this.validateCoupon(userCoupon, productDetails);
    }

    // 2. 주문 생성 (재고 차감 포함)
    const order = Order.create({
      userId,
      productDetails,
      userCoupon,
    });

    // 3. 포인트 차감
    const finalPrice = order.getFinalPrice();
    pointBalance.use(new Point(finalPrice));

    // 4. 포인트 거래 기록 생성
    const pointTransaction = PointTransaction.use(userId, finalPrice, pointBalance.getBalance().getValue());

    return {
      order,
      pointTransaction,
      updatedCoupon: userCoupon,
      updatedBalance: pointBalance,
    };
  }

  /**
   * 쿠폰 사용 가능 여부를 검증합니다.
   *
   * 검증 항목:
   * - 쿠폰이 이미 사용되었는지
   * - 쿠폰이 만료되었는지
   * - 최소 주문 금액을 충족하는지
   *
   * @private
   */
  private validateCoupon(
    userCoupon: UserCoupon,
    productDetails: Array<{ detail: ProductDetail; quantity: number }>,
  ): void {
    const totalPrice = productDetails.reduce((sum, { detail, quantity }) => sum + detail.getPrice() * quantity, 0);

    const minOrderAmount = userCoupon.getCoupon().getMinOrderAmount();
    const canUse = userCoupon.canUse(new Date(), new Point(totalPrice), minOrderAmount);

    if (!canUse) {
      throw new BadRequestException('사용할 수 없는 쿠폰입니다.');
    }
  }
}
