import { Inject, Injectable } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@/common/exceptions';
import { CART_REPOSITORY, type CartRepository } from '@/domain/cart/cart.repository';
import { CouponHistory } from '@/domain/coupon/coupon-history.entity';
import { Coupon } from '@/domain/coupon/coupon.entity';
import { COUPON_REPOSITORY, type CouponRepository } from '@/domain/coupon/coupon.repository';
import { UserCoupon } from '@/domain/coupon/user-coupon.entity';
import { OrderItem } from '@/domain/order/order-item.entity';
import { OrderStatus } from '@/domain/order/order-status.vo';
import { Order } from '@/domain/order/order.entity';
import { ORDER_REPOSITORY, type OrderRepository } from '@/domain/order/order.repository';
import { PointTransaction } from '@/domain/point/point-transaction.entity';
import { POINT_REPOSITORY, type PointRepository } from '@/domain/point/point.repository';
import { Point } from '@/domain/point/point.vo';
import { TransactionType } from '@/domain/point/transaction-type.vo';
import { PRODUCT_REPOSITORY, type ProductRepository } from '@/domain/product/product.repository';
import { ID_GENERATOR, type IdGenerator } from '@/infrastructure/id-generator/id-generator.interface';
import { UserMutexService } from './user-mutex.service';

export interface CreateOrderItem {
  productOptionId: string;
  quantity: number;
}

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(POINT_REPOSITORY)
    private readonly pointRepository: PointRepository,
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: CouponRepository,
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: CartRepository,
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IdGenerator,
    private readonly userMutexService: UserMutexService,
  ) {}

  async createOrder(
    userId: string,
    items: CreateOrderItem[],
    expectedAmount: number,
    userCouponId?: string,
  ): Promise<Order> {
    return this.userMutexService.withUserLock(userId, async () => {
      if (items.length === 0) {
        throw new BadRequestException('주문 항목이 없습니다.');
      }

      // 1. 상품 옵션 조회 및 재고 확인
      const productOptions = await Promise.all(
        items.map(async (item) => {
          const option = await this.productRepository.findOptionByIdWithLock(item.productOptionId);
          if (!option) {
            throw new NotFoundException(`상품 옵션을 찾을 수 없습니다: ${item.productOptionId}`);
          }

          if (!option.canOrder(item.quantity)) {
            throw new BadRequestException(`재고가 부족합니다: ${option.getName()}`);
          }

          return { option, quantity: item.quantity };
        }),
      );

      // 2. 주문 금액 계산
      let orderAmount = new Point(0);
      productOptions.forEach(({ option, quantity }) => {
        const productPrice = option.getAdditionalPrice();
        orderAmount = orderAmount.add(new Point(productPrice * quantity));
      });

      // 3. 쿠폰 할인 적용
      let discountAmount = new Point(0);
      let userCoupon: UserCoupon | null = null;
      let coupon: Coupon | null = null;

      if (userCouponId) {
        userCoupon = await this.couponRepository.findUserCouponById(userCouponId);
        if (!userCoupon) {
          throw new NotFoundException('쿠폰을 찾을 수 없습니다.');
        }

        if (userCoupon.getUserId() !== userId) {
          throw new BadRequestException('본인의 쿠폰만 사용할 수 있습니다.');
        }

        coupon = await this.couponRepository.findCouponById(userCoupon.getCouponId());
        if (!coupon) {
          throw new NotFoundException('쿠폰 정보를 찾을 수 없습니다.');
        }

        const now = new Date();
        if (!userCoupon.canUse(now, orderAmount, coupon.getMinOrderAmount())) {
          throw new BadRequestException('사용할 수 없는 쿠폰입니다.');
        }

        discountAmount = coupon.calculateDiscount(orderAmount);
      }

      // 4. 최종 금액 계산 및 검증
      const finalAmount = orderAmount.subtract(discountAmount);
      finalAmount.validateAmount(expectedAmount);

      // 5. 포인트 잔액 확인 및 차감
      const pointBalance = await this.pointRepository.findBalanceByUserId(userId);
      if (!pointBalance) {
        throw new NotFoundException('포인트 잔액을 찾을 수 없습니다.');
      }

      if (!pointBalance.getBalance().isGreaterThanOrEqual(finalAmount)) {
        throw new BadRequestException('포인트 잔액이 부족합니다.');
      }

      pointBalance.use(finalAmount);
      await this.pointRepository.saveBalance(pointBalance);

      // 6. 재고 차감
      for (const { option, quantity } of productOptions) {
        option.decreaseStock(quantity);
        await this.productRepository.saveOption(option);
      }

      // 7. 주문 생성
      const orderId = this.idGenerator.generate();
      const orderItems = productOptions.map(
        ({ option, quantity }) =>
          new OrderItem(
            this.idGenerator.generate(),
            orderId,
            option.getId(),
            quantity,
            new Point(option.getAdditionalPrice()),
            new Point(option.getAdditionalPrice() * quantity),
          ),
      );

      const order = new Order(
        orderId,
        userId,
        orderItems,
        orderAmount,
        discountAmount,
        finalAmount,
        userCouponId ?? null,
        new Date(),
      );

      await this.orderRepository.save(order);
      await this.orderRepository.saveItems(orderItems);

      // 8. 포인트 사용 내역 생성
      const pointTransaction = new PointTransaction(
        this.idGenerator.generate(),
        userId,
        TransactionType.USE,
        finalAmount,
        pointBalance.getBalance(),
        orderId,
        new Date(),
      );
      await this.pointRepository.createTransaction(pointTransaction);

      // 9. 쿠폰 사용 처리
      if (userCoupon && coupon) {
        userCoupon.use(orderId);
        await this.couponRepository.saveUserCoupon(userCoupon);

        const couponHistory = new CouponHistory(
          this.idGenerator.generate(),
          userCoupon.getId(),
          userId,
          userCoupon.getCouponId(),
          orderId,
          discountAmount,
          orderAmount,
          new Date(),
        );
        await this.couponRepository.saveHistory(couponHistory);
      }

      // 10. 장바구니에서 주문한 아이템 제거
      for (const item of items) {
        const cartItem = await this.cartRepository.findByUserIdAndProductOptionId(userId, item.productOptionId);
        if (cartItem) {
          await this.cartRepository.delete(cartItem.getId());
        }
      }

      return order;
    });
  }

  async getOrder(userId: string, orderId: string): Promise<Order> {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    if (order.getUserId() !== userId) {
      throw new BadRequestException('본인의 주문만 조회할 수 있습니다.');
    }

    return order;
  }

  async updateOrderStatus(userId: string, orderId: string, status: string): Promise<Order> {
    return this.userMutexService.withUserLock(userId, async () => {
      const order = await this.orderRepository.findByIdWithLock(orderId);

      if (!order) {
        throw new NotFoundException('주문을 찾을 수 없습니다.');
      }

      if (order.getUserId() !== userId) {
        throw new BadRequestException('본인의 주문만 수정할 수 있습니다.');
      }

      const newStatus = OrderStatus.fromString(status);

      if (newStatus.isCompleted()) {
        order.complete();
      } else if (newStatus.isCancelled()) {
        // 주문 취소 시 재고 복구, 포인트 환불, 쿠폰 복구
        await this.cancelOrder(order);
        order.cancel();
      } else {
        throw new BadRequestException('유효하지 않은 주문 상태입니다.');
      }

      await this.orderRepository.save(order);

      return order;
    });
  }

  private async cancelOrder(order: Order): Promise<void> {
    // 1. 재고 복구
    const orderItems = order.getItems();
    for (const item of orderItems) {
      const option = await this.productRepository.findOptionByIdWithLock(item.getProductOptionId());
      if (option) {
        option.increaseStock(item.getQuantity());
        await this.productRepository.saveOption(option);
      }
    }

    // 2. 포인트 환불
    const pointBalance = await this.pointRepository.findBalanceByUserId(order.getUserId());
    if (pointBalance) {
      pointBalance.charge(order.getFinalAmount());
      await this.pointRepository.saveBalance(pointBalance);

      const pointTransaction = new PointTransaction(
        this.idGenerator.generate(),
        order.getUserId(),
        TransactionType.REFUND,
        order.getFinalAmount(),
        pointBalance.getBalance(),
        order.getId(),
        new Date(),
      );
      await this.pointRepository.createTransaction(pointTransaction);
    }

    // 3. 쿠폰 복구
    if (order.hasCoupon()) {
      const userCoupon = await this.couponRepository.findUserCouponById(order.getUserCouponId()!);
      if (userCoupon) {
        userCoupon.restore();
        await this.couponRepository.saveUserCoupon(userCoupon);
      }
    }
  }
}
