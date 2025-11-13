import { CartItem } from '@/domain/cart/cart-item.entity';
import { Cart } from '@/domain/cart/cart.entity';
import { ProductOption } from '@/domain/product/product-option.entity';
import { ProductQuantity } from '@/domain/product/product-quantity.vo';

describe('Cart', () => {
  let productOption1: ProductOption;
  let productOption2: ProductOption;
  const userId = 1;

  beforeEach(() => {
    productOption1 = new ProductOption(
      1, // productOptionId
      100, // productId
      'Red - Large', // optionName
      'SKU-001', // sku
      10000, // price
      50, // stock
      new Date(), // createdAt
      new Date(), // updatedAt
    );

    productOption2 = new ProductOption(
      2, // productOptionId
      101, // productId
      'Blue - Medium', // optionName
      'SKU-002', // sku
      15000, // price
      30, // stock
      new Date(), // createdAt
      new Date(), // updatedAt
    );
  });

  describe('calculateTotalAmount', () => {
    it('장바구니의 총 금액을 계산할 수 있다', () => {
      // given
      const cartItem1 = CartItem.create(userId, productOption1, ProductQuantity.from(2), 10000);
      const cartItem2 = CartItem.create(userId, productOption2, ProductQuantity.from(3), 15000);
      const cart = Cart.create([cartItem1, cartItem2]);

      // when
      const totalAmount = cart.calculateTotalAmount();

      // then
      // cartItem1: 10000 * 2 = 20000
      // cartItem2: 15000 * 3 = 45000
      // total: 65000
      expect(totalAmount).toBe(65000);
    });

    it('단일 아이템 장바구니의 총 금액을 계산할 수 있다', () => {
      // given
      const cartItem = CartItem.create(userId, productOption1, ProductQuantity.from(5), 10000);
      const cart = Cart.create([cartItem]);

      // when
      const totalAmount = cart.calculateTotalAmount();

      // then
      expect(totalAmount).toBe(50000);
    });

    it('빈 장바구니의 총 금액은 0이다', () => {
      // given
      const cart = Cart.empty();

      // when
      const totalAmount = cart.calculateTotalAmount();

      // then
      expect(totalAmount).toBe(0);
    });
  });
});
