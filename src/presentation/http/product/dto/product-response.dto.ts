export class ProductOptionDto {
  id: string;
  productId: string;
  name: string;
  additionalPrice: number;
  stock: number;
}

export class ProductDetailDto {
  id: string;
  name: string;
  description: string;
  price: number;
  options: ProductOptionDto[];
}

export class GetProductDetailResponseDto {
  product: ProductDetailDto;
}
