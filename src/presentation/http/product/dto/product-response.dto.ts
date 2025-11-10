export class ProductOptionDto {
  id: number;
  productId: number;
  name: string;
  sku: string;
  stock: number;
}

export class ProductDetailDto {
  id: number;
  name: string;
  description: string;
  price: number;
  options: ProductOptionDto[];
}

export class GetProductDetailResponseDto {
  product: ProductDetailDto;
}
