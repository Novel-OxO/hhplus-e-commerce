# 패션 커머스 시스템 - 상품 옵션 유즈케이스

## 시스템 개요

본 시스템은 무신사를 간략화하여 모방하는 패션 커머스 플랫폼입니다.

## 도메인 설명

### 상품 도메인

상품 도메인은 크게 **상품(Product)** 과 **상품 옵션(Product Option)** 으로 구성됩니다.

- **상품(Product)**: 판매하는 아이템의 기본 정보 (이름, 설명, 기준 가격 등)
- **상품 옵션(Product Option)**: 상품의 개별 Stock keeping Unit(SKU) (색상, 사이즈... 확장 가능)

## 구현해야 하는 유즈케이스

### 1. 상품 관리

#### 1.1 상품 정보 조회 (가격, 재고)

- 특정 상품의 상세 정보를 조회
- 해당 상품의 모든 옵션 정보 포함 (가격, 재고)

#### 1.2 재고 실시간 확인

- 상품 옵션별 재고 수량을 실시간으로 확인
- 장바구니 담기 및 주문 전 재고 검증에 사용

#### 1.3 인기 상품 통계 (최근 3일, Top 5)

- 최근 3일간 조회수 기반으로 인기 상품 Top 5 조회
- 사용자에게 인기 상품 추천

---

## API 요약

### 상품 관리 API

| Method | Endpoint            | 설명           | 주요 기능                                    |
| ------ | ------------------- | -------------- | -------------------------------------------- |
| `GET`  | `/products`         | 상품 목록 조회 | 페이지네이션, 재고 필터, 정렬 옵션 제공     |
| `GET`  | `/products/:id`     | 상품 정보 조회 | 상품 상세 정보 및 옵션 목록 반환             |
| `GET`  | `/products/popular` | 인기 상품 조회 | 판매량 기준 인기 상품 반환 (기본 Top 10)    |

### 요청/응답 예시

#### 1. 상품 정보 조회

**Request**

```http
GET /products/1
```

**Response**

```json
{
  "id": 1,
  "name": "베이직 티셔츠",
  "description": "편안한 면 소재",
  "basePrice": 29000,
  "category": "상의",
  "options": [
    {
      "id": 1,
      "sku": "TSHIRT-RED-M",
      "color": "빨강",
      "size": "M",
      "price": 29000,
      "stock": 150
    },
    {
      "id": 2,
      "sku": "TSHIRT-BLUE-L",
      "color": "파랑",
      "size": "L",
      "price": 29000,
      "stock": 80
    }
  ]
}
```

#### 2. 재고 실시간 확인

**Request**

```http
GET /products/1/options/1/stock
```

**Response**

```json
{
  "optionId": 1,
  "sku": "TSHIRT-RED-M",
  "stock": 150,
  "isAvailable": true
}
```

#### 3. 인기 상품 조회

**Request**

```http
GET /products/popular?days=3&limit=5
```

**Response**

```json
{
  "products": [
    {
      "id": 5,
      "name": "오버핏 후드",
      "basePrice": 45000,
      "viewCount": 1523,
      "thumbnailUrl": "https://example.com/image.jpg"
    },
    {
      "id": 12,
      "name": "슬림핏 청바지",
      "basePrice": 59000,
      "viewCount": 1402,
      "thumbnailUrl": "https://example.com/image2.jpg"
    }
  ],
  "period": {
    "days": 3,
    "from": "2025-10-25T00:00:00Z",
    "to": "2025-10-28T23:59:59Z"
  }
}
```
