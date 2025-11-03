/* eslint-disable @typescript-eslint/require-await */
import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from '@/application/cart.service';
import { CartItem } from '@/domain/cart/cart-item.entity';
import { CART_REPOSITORY, type CartRepository } from '@/domain/cart/cart.repository';
import { ProductOption } from '@/domain/product/product-option.entity';
import { PRODUCT_REPOSITORY, type ProductRepository } from '@/domain/product/product.repository';
import { BadRequestException, ForbiddenException, NotFoundException } from '@/common/exceptions';
import { ID_GENERATOR, type IdGenerator } from '@/infrastructure/id-generator/id-generator.interface';

describe('CartService', () => {
  let service: CartService;
  let cartRepository: jest.Mocked<CartRepository>;
  let productRepository: jest.Mocked<ProductRepository>;
  let idGenerator: jest.Mocked<IdGenerator>;

  beforeEach(async () => {
    const mockCartRepository: jest.Mocked<CartRepository> = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
      findByUserIdAndProductOptionId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      deleteByUserId: jest.fn(),
    };

    const mockProductRepository: jest.Mocked<ProductRepository> = {
      findById: jest.fn(),
      findOptionsByProductId: jest.fn(),
      findOptionById: jest.fn(),
      findPopularByPeriod: jest.fn(),
      saveOption: jest.fn(),
      saveProduct: jest.fn(),
      findOptionByIdWithLock: jest.fn(),
    };

    const mockIdGenerator: jest.Mocked<IdGenerator> = {
      generate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: CART_REPOSITORY,
          useValue: mockCartRepository,
        },
        {
          provide: PRODUCT_REPOSITORY,
          useValue: mockProductRepository,
        },
        {
          provide: ID_GENERATOR,
          useValue: mockIdGenerator,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepository = module.get(CART_REPOSITORY);
    productRepository = module.get(PRODUCT_REPOSITORY);
    idGenerator = module.get(ID_GENERATOR);
  });

  describe('addCartItem', () => {
    it('새로운 상품을 장바구니에 추가한다', async () => {
      // given
      const userId = 'user123';
      const productOptionId = 'option123';
      const quantity = 2;
      const generatedId = 'cart123';

      const productOption = new ProductOption(productOptionId, 'product123', 'Red', 5000, 10, new Date(), new Date());

      productRepository.findOptionById.mockResolvedValue(productOption);
      cartRepository.findByUserIdAndProductOptionId.mockResolvedValue(null);
      idGenerator.generate.mockReturnValue(generatedId);
      cartRepository.save.mockImplementation(async (cartItem) => cartItem);

      // when
      const result = await service.addCartItem(userId, productOptionId, quantity);

      // then
      expect(result.cartItem.getId()).toBe(generatedId);
      expect(result.cartItem.getUserId()).toBe(userId);
      expect(result.cartItem.getProductOptionId()).toBe(productOptionId);
      expect(result.cartItem.getQuantity()).toBe(quantity);
      expect(result.cartItem.getSavedPrice()).toBe(5000);
      expect(result.currentStock).toBe(10);
    });

    it('기존 장바구니 아이템이 있으면 수량을 증가시킨다', async () => {
      // given
      const userId = 'user123';
      const productOptionId = 'option123';
      const existingQuantity = 1;
      const addQuantity = 2;

      const productOption = new ProductOption(productOptionId, 'product123', 'Red', 5000, 10, new Date(), new Date());

      const existingCartItem = new CartItem('cart123', userId, productOptionId, existingQuantity, 5000, new Date());

      productRepository.findOptionById.mockResolvedValue(productOption);
      cartRepository.findByUserIdAndProductOptionId.mockResolvedValue(existingCartItem);
      cartRepository.save.mockImplementation(async (cartItem) => cartItem);

      // when
      const result = await service.addCartItem(userId, productOptionId, addQuantity);

      // then
      expect(result.cartItem.getQuantity()).toBe(existingQuantity + addQuantity);
      expect(result.currentStock).toBe(10);
    });

    it('수량이 0 이하이면 예외를 발생시킨다', async () => {
      // given
      const userId = 'user123';
      const productOptionId = 'option123';
      const quantity = 0;

      // when & then
      await expect(service.addCartItem(userId, productOptionId, quantity)).rejects.toThrow(BadRequestException);
      await expect(service.addCartItem(userId, productOptionId, quantity)).rejects.toThrow(
        '수량은 1 이상이어야 합니다.',
      );
    });

    it('상품 옵션을 찾을 수 없으면 예외를 발생시킨다', async () => {
      // given
      const userId = 'user123';
      const productOptionId = 'nonexistent';
      const quantity = 1;

      productRepository.findOptionById.mockResolvedValue(null);

      // when & then
      await expect(service.addCartItem(userId, productOptionId, quantity)).rejects.toThrow(NotFoundException);
      await expect(service.addCartItem(userId, productOptionId, quantity)).rejects.toThrow(
        '상품 옵션을 찾을 수 없습니다.',
      );
    });
  });

  describe('getCart', () => {
    it('장바구니 아이템 목록과 총액을 조회한다', async () => {
      // given
      const userId = 'user123';

      const cartItem1 = new CartItem('cart1', userId, 'option1', 2, 5000, new Date());
      const cartItem2 = new CartItem('cart2', userId, 'option2', 1, 10000, new Date());

      const productOption1 = new ProductOption('option1', 'product1', 'Red', 5000, 10, new Date(), new Date());
      const productOption2 = new ProductOption('option2', 'product2', 'Blue', 10000, 5, new Date(), new Date());

      cartRepository.findByUserId.mockResolvedValue([cartItem1, cartItem2]);
      productRepository.findOptionById.mockImplementation(async (id) => {
        if (id === 'option1') return productOption1;
        if (id === 'option2') return productOption2;
        return null;
      });

      // when
      const result = await service.getCart(userId);

      // then
      expect(result.items).toHaveLength(2);
      expect(result.items[0].cartItem).toBe(cartItem1);
      expect(result.items[0].currentPrice).toBe(5000);
      expect(result.items[0].currentStock).toBe(10);
      expect(result.items[0].isPriceChanged).toBe(false);
      expect(result.items[0].isStockSufficient).toBe(true);
      expect(result.items[1].cartItem).toBe(cartItem2);
      expect(result.items[1].currentPrice).toBe(10000);
      expect(result.items[1].currentStock).toBe(5);
      expect(result.items[1].isPriceChanged).toBe(false);
      expect(result.items[1].isStockSufficient).toBe(true);
      expect(result.totalAmount).toBe(20000);
    });

    it('가격이 변경된 상품을 감지한다', async () => {
      // given
      const userId = 'user123';
      const cartItem = new CartItem('cart1', userId, 'option1', 2, 5000, new Date());
      const productOption = new ProductOption('option1', 'product1', 'Red', 6000, 10, new Date(), new Date());

      cartRepository.findByUserId.mockResolvedValue([cartItem]);
      productRepository.findOptionById.mockResolvedValue(productOption);

      // when
      const result = await service.getCart(userId);

      // then
      expect(result.items[0].isPriceChanged).toBe(true);
      expect(result.items[0].currentPrice).toBe(6000);
      expect(result.totalAmount).toBe(12000);
    });

    it('재고가 부족한 상품을 감지한다', async () => {
      // given
      const userId = 'user123';
      const cartItem = new CartItem('cart1', userId, 'option1', 5, 5000, new Date());
      const productOption = new ProductOption('option1', 'product1', 'Red', 5000, 3, new Date(), new Date());

      cartRepository.findByUserId.mockResolvedValue([cartItem]);
      productRepository.findOptionById.mockResolvedValue(productOption);

      // when
      const result = await service.getCart(userId);

      // then
      expect(result.items[0].isStockSufficient).toBe(false);
      expect(result.items[0].currentStock).toBe(3);
    });

    it('장바구니가 비어있으면 빈 배열과 0원을 반환한다', async () => {
      // given
      const userId = 'user123';

      cartRepository.findByUserId.mockResolvedValue([]);

      // when
      const result = await service.getCart(userId);

      // then
      expect(result.items).toEqual([]);
      expect(result.totalAmount).toBe(0);
    });

    it('상품 옵션이 삭제된 아이템은 제외한다', async () => {
      // given
      const userId = 'user123';
      const cartItem1 = new CartItem('cart1', userId, 'option1', 2, 5000, new Date());
      const cartItem2 = new CartItem('cart2', userId, 'option2', 1, 10000, new Date());

      const productOption1 = new ProductOption('option1', 'product1', 'Red', 5000, 10, new Date(), new Date());

      cartRepository.findByUserId.mockResolvedValue([cartItem1, cartItem2]);
      productRepository.findOptionById.mockImplementation(async (id) => {
        if (id === 'option1') return productOption1;
        return null;
      });

      // when
      const result = await service.getCart(userId);

      // then
      expect(result.items).toHaveLength(1);
      expect(result.items[0].cartItem).toBe(cartItem1);
      expect(result.totalAmount).toBe(10000);
    });
  });

  describe('removeCartItem', () => {
    it('장바구니 아이템을 삭제한다', async () => {
      // given
      const userId = 'user123';
      const cartItemId = 'cart123';
      const cartItem = new CartItem(cartItemId, userId, 'option123', 2, 5000, new Date());

      cartRepository.findById.mockResolvedValue(cartItem);
      cartRepository.delete.mockResolvedValue(undefined);

      // when
      await service.removeCartItem(userId, cartItemId);

      // then
      // 예외가 발생하지 않음을 확인
    });

    it('장바구니 아이템을 찾을 수 없으면 예외를 발생시킨다', async () => {
      // given
      const userId = 'user123';
      const cartItemId = 'nonexistent';

      cartRepository.findById.mockResolvedValue(null);

      // when & then
      await expect(service.removeCartItem(userId, cartItemId)).rejects.toThrow(NotFoundException);
      await expect(service.removeCartItem(userId, cartItemId)).rejects.toThrow('장바구니 아이템을 찾을 수 없습니다.');
    });

    it('다른 사용자의 장바구니 아이템을 삭제하려고 하면 예외를 발생시킨다', async () => {
      // given
      const userId = 'user123';
      const cartItemId = 'cart123';
      const cartItem = new CartItem(cartItemId, 'otherUser', 'option123', 2, 5000, new Date());

      cartRepository.findById.mockResolvedValue(cartItem);

      // when & then
      await expect(service.removeCartItem(userId, cartItemId)).rejects.toThrow(ForbiddenException);
      await expect(service.removeCartItem(userId, cartItemId)).rejects.toThrow(
        '장바구니 아이템에 대한 권한이 없습니다.',
      );
    });
  });

  describe('clearCart', () => {
    it('사용자의 모든 장바구니 아이템을 삭제한다', async () => {
      // given
      const userId = 'user123';

      cartRepository.deleteByUserId.mockResolvedValue(undefined);

      // when
      await service.clearCart(userId);

      // then
      // 예외가 발생하지 않음을 확인
    });
  });
});
