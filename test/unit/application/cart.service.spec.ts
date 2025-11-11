import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from '@/application/cart/cart.service';
import { CartItem } from '@/domain/cart/cart-item.entity';
import { Cart } from '@/domain/cart/cart.entity';
import { CART_REPOSITORY, type CartRepository } from '@/domain/cart/cart.repository';
import { ProductOption } from '@/domain/product/product-option.entity';
import { ProductQuantity } from '@/domain/product/product-quantity.vo';
import { PRODUCT_REPOSITORY, type ProductRepository } from '@/domain/product/product.repository';

describe('CartService', () => {
  let service: CartService;
  let cartRepository: jest.Mocked<CartRepository>;
  let productRepository: jest.Mocked<ProductRepository>;

  beforeEach(async () => {
    const mockCartRepository: jest.Mocked<CartRepository> = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
      findByUserIdAndProductOptionId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      deleteByUserId: jest.fn(),
      deleteByCartIdAndUserId: jest.fn(),
    };

    const mockProductRepository: jest.Mocked<ProductRepository> = {
      findByIdOrElseThrow: jest.fn(),
      findWithOptionsByProductIdOrElseThrow: jest.fn(),
      findOptionByIdOrElseThrow: jest.fn(),
      findOptionByOptionIdAndProductIdOrElseThrow: jest.fn(),
      findDetailsByOptionIds: jest.fn(),
      saveViewLog: jest.fn(),
      saveRanking: jest.fn(),
      aggregateViewsForDate: jest.fn(),
      findRankingsByDate: jest.fn(),
      findProductsByIds: jest.fn(),
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
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepository = module.get(CART_REPOSITORY);
    productRepository = module.get(PRODUCT_REPOSITORY);
  });

  describe('addCartItem', () => {
    const userId = 100;
    const productOptionId = 1;
    const quantity = ProductQuantity.from(2);
    const price = 10000;

    let productOption: ProductOption;

    beforeEach(() => {
      productOption = new ProductOption(
        productOptionId,
        1, // productId
        'Red - Large', // optionName
        'SKU-001', // sku
        price,
        50, // stock
        new Date(), // createdAt
        new Date(), // updatedAt
      );
    });

    describe('정상 케이스', () => {
      it('장바구니에 새 아이템을 추가한다', async () => {
        // Given
        productRepository.findOptionByIdOrElseThrow.mockResolvedValue(productOption);
        cartRepository.findByUserIdAndProductOptionId.mockResolvedValue(null);

        const newCartItem = CartItem.create(userId, productOption, quantity, price);
        cartRepository.save.mockResolvedValue(newCartItem);

        // When
        const result = await service.addCartItem(userId, productOptionId, quantity);

        // Then
        expect(result).toBeInstanceOf(CartItem);
        expect(result.getUserId()).toBe(userId);
        expect(result.getProductOption().getProductOptionId()).toBe(productOptionId);
        expect(result.getQuantity().getValue()).toBe(quantity.getValue());
        expect(result.getPrice()).toBe(price);
      });

      it('이미 장바구니에 있는 아이템의 수량을 증가시킨다', async () => {
        // Given
        const existingQuantity = ProductQuantity.from(3);
        const existingCartItem = CartItem.create(userId, productOption, existingQuantity, price);
        const increasedQuantity = ProductQuantity.from(5); // 3 + 2

        productRepository.findOptionByIdOrElseThrow.mockResolvedValue(productOption);
        cartRepository.findByUserIdAndProductOptionId.mockResolvedValue(existingCartItem);
        cartRepository.save.mockImplementation((cartItem) => Promise.resolve(cartItem));

        // When
        const result = await service.addCartItem(userId, productOptionId, quantity);

        // Then
        expect(result).toBeInstanceOf(CartItem);
        expect(result.getQuantity().getValue()).toBe(increasedQuantity.getValue());
        expect(result.getUserId()).toBe(userId);
        expect(result.getProductOption().getProductOptionId()).toBe(productOptionId);
      });
    });
  });

  describe('getCart', () => {
    const userId = 100;

    describe('정상 케이스', () => {
      it('장바구니에 아이템이 있으면 Cart를 생성하여 반환한다', async () => {
        // Given
        const productOption = new ProductOption(
          1, // productOptionId
          1, // productId
          'Red - Large', // optionName
          'SKU-001', // sku
          10000, // price
          50, // stock
          new Date(), // createdAt
          new Date(), // updatedAt
        );

        const cartItem1 = CartItem.create(userId, productOption, ProductQuantity.from(2), 10000);
        const cartItem2 = CartItem.create(userId, productOption, ProductQuantity.from(3), 10000);
        const cartItems = [cartItem1, cartItem2];

        cartRepository.findByUserId.mockResolvedValue(cartItems);

        // When
        const result = await service.getCart(userId);

        // Then
        expect(result).toBeInstanceOf(Cart);
        expect(result.getItems()).toHaveLength(2);
        expect(result.getItems()).toEqual(cartItems);
        expect(result.isEmpty()).toBe(false);
      });

      it('장바구니가 비어있으면 빈 Cart를 반환한다', async () => {
        // Given
        cartRepository.findByUserId.mockResolvedValue([]);

        // When
        const result = await service.getCart(userId);

        // Then
        expect(result).toBeInstanceOf(Cart);
        expect(result.getItems()).toHaveLength(0);
        expect(result.isEmpty()).toBe(true);
      });
    });
  });
});
