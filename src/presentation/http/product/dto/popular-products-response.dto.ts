export class PopularProductDto {
  id: string;
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
