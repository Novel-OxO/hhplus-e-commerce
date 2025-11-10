export class PopularProductDto {
  id: number;
  name: string;
  description: string;
  price: number;
}

export class GetPopularProductsResponseDto {
  products: PopularProductDto[];
  period: {
    days: number;
  };
}
