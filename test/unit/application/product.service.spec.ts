import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from '@/application/product.service';
import { ProductOption } from '@/domain/product/product-option.entity';
import { Product } from '@/domain/product/product.entity';
import { PRODUCT_REPOSITORY, type ProductRepository } from '@/domain/product/product.repository';
import { NotFoundException } from '@/common/exceptions';

describe('ProductService', () => {
  let service: ProductService;
  let repository: jest.Mocked<ProductRepository>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<ProductRepository> = {
      findById: jest.fn(),
      findOptionsByProductId: jest.fn(),
      findOptionById: jest.fn(),
      findPopularByPeriod: jest.fn(),
      saveOption: jest.fn(),
      findOptionByIdWithLock: jest.fn(),
      saveProduct: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    repository = module.get(PRODUCT_REPOSITORY);
  });

  describe('getProductWithOptions', () => {
    it('상품 ID로 상품과 옵션을 조회한다', async () => {
      const productId = 'product123';
      const product = new Product(productId, '베이직 티셔츠', '편안한 면 소재', 29000, new Date(), new Date());

      const options = [
        new ProductOption('option1', productId, '빨강 - M', 0, 150, new Date(), new Date()),
        new ProductOption('option2', productId, '파랑 - L', 0, 80, new Date(), new Date()),
      ];

      repository.findById.mockResolvedValue(product);
      repository.findOptionsByProductId.mockResolvedValue(options);

      const result = await service.getProductWithOptions(productId);

      expect(result.getProduct()).toBe(product);
      expect(result.getOptions()).toEqual(options);
      expect(result.getOptions().length).toBe(2);
    });

    it('상품이 존재하지 않으면 예외를 발생시킨다', async () => {
      const productId = 'nonexistent';

      repository.findById.mockResolvedValue(null);

      await expect(service.getProductWithOptions(productId)).rejects.toThrow(NotFoundException);
      await expect(service.getProductWithOptions(productId)).rejects.toThrow('상품을 찾을 수 없습니다.');
    });

    it('상품은 존재하지만 옵션이 없는 경우를 처리한다', async () => {
      const productId = 'product123';
      const product = new Product(productId, '베이직 티셔츠', '편안한 면 소재', 29000, new Date(), new Date());

      repository.findById.mockResolvedValue(product);
      repository.findOptionsByProductId.mockResolvedValue([]);

      const result = await service.getProductWithOptions(productId);

      expect(result.getProduct()).toBe(product);
      expect(result.getOptions()).toEqual([]);
      expect(result.hasOptions()).toBe(false);
    });
  });

  describe('getOptionStock', () => {
    it('특정 상품의 특정 옵션 재고를 조회한다', async () => {
      const productId = 'product123';
      const optionId = 'option123';

      const product = new Product(productId, '베이직 티셔츠', '편안한 면 소재', 29000, new Date(), new Date());

      const option = new ProductOption(optionId, productId, '빨강 - M', 0, 150, new Date(), new Date());

      repository.findById.mockResolvedValue(product);
      repository.findOptionById.mockResolvedValue(option);

      const result = await service.getOptionStock(productId, optionId);

      expect(result).toBe(option);
      expect(result.getId()).toBe(optionId);
      expect(result.getProductId()).toBe(productId);
      expect(result.getStock()).toBe(150);
    });

    it('상품이 존재하지 않으면 예외를 발생시킨다', async () => {
      const productId = 'nonexistent';
      const optionId = 'option123';

      repository.findById.mockResolvedValue(null);

      await expect(service.getOptionStock(productId, optionId)).rejects.toThrow(NotFoundException);
      await expect(service.getOptionStock(productId, optionId)).rejects.toThrow('상품을 찾을 수 없습니다.');
    });

    it('옵션이 존재하지 않으면 예외를 발생시킨다', async () => {
      const productId = 'product123';
      const optionId = 'nonexistent';

      const product = new Product(productId, '베이직 티셔츠', '편안한 면 소재', 29000, new Date(), new Date());

      repository.findById.mockResolvedValue(product);
      repository.findOptionById.mockResolvedValue(null);

      await expect(service.getOptionStock(productId, optionId)).rejects.toThrow(NotFoundException);
      await expect(service.getOptionStock(productId, optionId)).rejects.toThrow('상품 옵션을 찾을 수 없습니다.');
    });

    it('옵션이 다른 상품의 것이면 예외를 발생시킨다', async () => {
      const productId = 'product123';
      const optionId = 'option123';
      const differentProductId = 'product456';

      const product = new Product(productId, '베이직 티셔츠', '편안한 면 소재', 29000, new Date(), new Date());

      const option = new ProductOption(optionId, differentProductId, '빨강 - M', 0, 150, new Date(), new Date());

      repository.findById.mockResolvedValue(product);
      repository.findOptionById.mockResolvedValue(option);

      await expect(service.getOptionStock(productId, optionId)).rejects.toThrow(NotFoundException);
      await expect(service.getOptionStock(productId, optionId)).rejects.toThrow('해당 상품의 옵션이 아닙니다.');
    });
  });
});
