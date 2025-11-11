/**
 * 상품별 조회수를 나타내는 Value Object
 * Repository에서 집계된 조회수 데이터를 타입 안전하게 전달
 */
export class ProductViewCount {
  private constructor(
    private readonly productId: number,
    private readonly viewCount: number,
  ) {
    this.validateProductId(productId);
    this.validateViewCount(viewCount);
  }

  /**
   * ProductViewCount 생성
   * @param productId - 상품 ID
   * @param viewCount - 조회수 (bigint를 number로 변환하여 전달)
   */
  static create(productId: number, viewCount: bigint | number): ProductViewCount {
    const count = typeof viewCount === 'bigint' ? Number(viewCount) : viewCount;
    return new ProductViewCount(productId, count);
  }

  private validateProductId(productId: number): void {
    if (productId <= 0) {
      throw new Error('상품 ID는 0보다 커야 합니다.');
    }
  }

  private validateViewCount(viewCount: number): void {
    if (viewCount < 0) {
      throw new Error('조회수는 0 이상이어야 합니다.');
    }

    if (!Number.isInteger(viewCount)) {
      throw new Error('조회수는 정수여야 합니다.');
    }
  }

  getProductId(): number {
    return this.productId;
  }

  getViewCount(): number {
    return this.viewCount;
  }

  /**
   * 조회수 기준 비교 (내림차순 정렬용)
   */
  compareByViewCount(other: ProductViewCount): number {
    return other.viewCount - this.viewCount; // 내림차순
  }

  /**
   * 다른 ProductViewCount와 동일한지 확인
   */
  equals(other: ProductViewCount): boolean {
    return this.productId === other.productId && this.viewCount === other.viewCount;
  }
}
