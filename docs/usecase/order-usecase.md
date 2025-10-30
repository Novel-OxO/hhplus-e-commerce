# 패션 커머스 시스템 - 주문 유즈케이스

## 시스템 개요

본 시스템은 무신사를 간략화하여 모방하는 패션 커머스 플랫폼입니다.

## 도메인 설명

### 주문 도메인

주문 도메인은 크게 **장바구니(Cart)**, **주문(Order)**, **쿠폰(Coupon)**, **포인트(Point)** 로 구성됩니다.

- **장바구니(Cart)**: 사용자가 구매할 상품 옵션(SKU)을 임시로 담아두는 공간
- **주문(Order)**: 실제 구매 요청 및 처리 정보 (상품 옵션 단위로 처리)
- **쿠폰(Coupon)**: 할인 혜택 정보
- **포인트(Point)**: 주문 결제 수단 (포인트로만 결제 가능)
- **상품(Product)**: 베이직 티셔츠 (기본 상품 정보)
- **상품 옵션(Product Option/SKU)**: 베이직 티셔츠 - 빨강/M, 베이직 티셔츠 - 파랑/L 등

**중요**: 본 시스템은 **포인트만으로 결제**하는 시스템입니다. 외부 PG 연동은 포인트 충전시에 진행됩니다.

**참고**: 패션 커머스에서는 상품(Product)과 상품 옵션(Product Option)이 분리되어 있으며, 주문/장바구니는 **상품 옵션(SKU) 단위**로 처리됩니다.

## 구현해야 하는 유즈케이스

### 1. 장바구니 관리

#### 1.1 장바구니에 상품 옵션(SKU) 추가

- 사용자가 선택한 상품 옵션(색상, 사이즈 등)을 장바구니에 추가
- 재고 부족 시 경고 메시지 표시
- 이미 담긴 동일 옵션은 수량 증가

#### 1.2 장바구니 조회

- 담긴 상품 옵션 목록과 총액 확인
- 가격/재고 변경 감지 및 알림
- 상품 옵션 삭제 여부 확인

#### 1.3 장바구니 삭제

- 특정 상품 옵션을 장바구니에서 제거
- 전체 장바구니 비우기

### 2. 주문 관리

#### 2.1 주문 생성 및 포인트 결제

- 클라이언트가 선택한 상품 옵션과 수량을 명시적으로 전달하여 주문 생성
- 재고 확인 및 차감
- 쿠폰 할인 적용 (선택적)
- 최종 결제 금액 계산: 주문 금액 - 쿠폰 할인
- **포인트로 최종 금액 전액 결제** (포인트 잔액에서 차감)
- 포인트 잔액 부족 시 주문 생성 실패
- 주문 완료 후 장바구니에서 해당 아이템 제거 (선택적)

#### 2.2 주문 상태 변경

- 주문 상태: PENDING → COMPLETED (정상 완료)
- 주문 상태: PENDING → CANCELLED (취소)

---

## API 요약

### 장바구니 관리 API

| Method   | Endpoint               | 설명                    | 주요 기능                                   |
| -------- | ---------------------- | ----------------------- | ------------------------------------------- |
| `POST`   | `/carts/items`         | 장바구니 상품 옵션 추가 | 상품 옵션(SKU)을 장바구니에 추가, 재고 경고 |
| `GET`    | `/carts`               | 장바구니 조회           | 담긴 상품 옵션 목록 및 총액, 변경사항 알림  |
| `DELETE` | `/carts/items/:itemId` | 장바구니 상품 옵션 삭제 | 특정 상품 옵션 제거                         |
| `DELETE` | `/carts`               | 장바구니 전체 삭제      | 모든 상품 옵션 제거                         |

### 주문 관리 API

| Method  | Endpoint                  | 설명                       | 주요 기능                                 |
| ------- | ------------------------- | -------------------------- | ----------------------------------------- |
| `POST`  | `/orders`                 | 주문 생성 및 포인트 결제   | 장바구니 상품으로 주문 생성 및 포인트 결제 |
| `GET`   | `/orders/:orderId`        | 주문 조회                  | 주문 상세 정보 확인                       |
| `PATCH` | `/orders/:orderId/status` | 주문 상태 변경             | 주문 상태 업데이트                        |

---

## 요청/응답 예시

### 1. 장바구니 상품 옵션(SKU) 추가

**Request**

```json
POST /carts/items

{
  "productOptionId": 1,  // 상품 옵션 ID (특정 색상/사이즈 조합의 SKU)
  "quantity": 2
}
```

**Response**

```json
{
  "cartItemId": 1,
  "productOption": {
    "id": 1,
    "sku": "TSHIRT-RED-M", // SKU 코드
    "productName": "베이직 티셔츠",
    "color": "빨강",
    "size": "M",
    "price": 29000
  },
  "quantity": 2,
  "currentStock": 150
}
```

### 2. 장바구니 조회

**Request**

```json
GET /carts
```

**Response**

```json
{
  "items": [
    {
      "cartItemId": 1,
      "productOption": {
        "id": 1,
        "sku": "TSHIRT-RED-M", // SKU 코드로 상품 옵션 식별
        "productId": 1,
        "productName": "베이직 티셔츠",
        "color": "빨강",
        "size": "M",
        "price": 29000
      },
      "quantity": 2,
      "savedPrice": 29000, // 장바구니 추가 시점 가격
      "currentPrice": 29000, // 현재 시점 가격
      "currentStock": 150,
      "isPriceChanged": false,
      "isStockSufficient": true,
      "subtotal": 58000
    }
  ],
  "totalAmount": 58000,
  "totalItems": 1
}
```

**참고**

- 각 아이템은 상품 옵션(SKU) 단위로 표시
- `sku` 필드로 정확한 재고 관리 및 주문 추적 가능

### 3. 주문 생성 (포인트 결제)

**Request**

```json
POST /orders

{
  "items": [
    {
      "productOptionId": 1,  // 상품 옵션(SKU) ID
      "quantity": 2
    },
    {
      "productOptionId": 5,  // 다른 상품 옵션(SKU) ID
      "quantity": 1
    }
  ],
  "expectedAmount": 92700,
  "couponId": 1  // 선택적: 쿠폰 적용 시 포함
}
```

**Response**

```json
{
  "orderId": 1,
  "status": "PENDING",
  "items": [
    {
      "productOptionId": 1,
      "sku": "TSHIRT-RED-M", // SKU 코드로 정확한 주문 추적
      "productName": "베이직 티셔츠",
      "optionDetails": "빨강/M",
      "quantity": 2,
      "unitPrice": 29000,
      "subtotal": 58000
    },
    {
      "productOptionId": 5,
      "sku": "JEANS-BLUE-32",
      "productName": "슬림 청바지",
      "optionDetails": "블루/32",
      "quantity": 1,
      "unitPrice": 45000,
      "subtotal": 45000
    }
  ],
  "orderAmount": 103000,
  "discountAmount": 10300,
  "finalAmount": 92700,
  "pointsUsed": 92700,
  "coupon": {
    "id": 1,
    "name": "신규 가입 10% 할인",
    "discountType": "PERCENTAGE",
    "discountValue": 10
  },
  "pointBalance": {
    "previousBalance": 100000,
    "currentBalance": 7300
  },
  "createdAt": "2025-10-28T10:30:00Z"
}
```

**참고**

- 클라이언트가 주문할 **상품 옵션(SKU)**과 수량을 명시적으로 전달
- 장바구니 전체가 아닌 선택한 상품 옵션만 주문 가능
- 각 주문 아이템은 `sku` 코드로 정확히 식별되어 재고 차감 및 배송 처리
- 쿠폰은 주문 생성 시 선택적으로 적용 가능
- **최종 결제 금액 = 주문 금액 - 쿠폰 할인**
- **최종 금액을 포인트로 전액 결제** (`finalAmount` == `pointsUsed`)
- 서버에서 각 상품 옵션의 최신 가격으로 실제 총액을 계산하여 예상 금액과 비교 검증
- 유효하지 않은 쿠폰, 포인트 잔액 부족, 가격 불일치 시 주문 생성 실패 및 오류 반환
- 포인트는 주문 생성과 동시에 차감되며, 주문 실패 시 롤백됨
