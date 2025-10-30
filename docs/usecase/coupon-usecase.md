# 패션 커머스 시스템 - 쿠폰 유즈케이스

## 시스템 개요

본 시스템은 무신사를 간략화하여 모방하는 패션 커머스 플랫폼입니다.

## 도메인 설명

### 쿠폰 도메인

쿠폰 도메인은 **쿠폰(Coupon)**, **사용자 쿠폰(User Coupon)**, **쿠폰 사용 이력(Coupon Usage History)**으로 구성됩니다.

- **쿠폰(Coupon)**: 할인 혜택의 기본 정보 (할인율, 최대/최소 금액, 발급 수량, 유효기간)
- **사용자 쿠폰(User Coupon)**: 사용자가 발급받은 쿠폰 (발급 시점, 사용 여부, 만료일)
- **쿠폰 사용 이력(Coupon Usage History)**: 쿠폰 사용 내역 추적 (발급 시간, 사용 시간, 할인 금액)

**참고**: 쿠폰은 주문 생성 시 **상품 옵션(SKU) 단위로 처리된 주문 금액**에 적용됩니다.

- 주문 금액 = 선택한 상품 옵션들의 합계
- 쿠폰 할인 = 주문 금액에 대한 정액/정률 할인
- 최종 결제 금액 = 주문 금액 - 쿠폰 할인

## 구현해야 하는 유즈케이스

### 1. 쿠폰 관리

#### 1.1 선착순 쿠폰 발급 (한정 수량)

- 사용자가 선착순 쿠폰 발급을 요청
- 발급 가능한 수량이 남아있는지 실시간 확인
- 동시성 제어를 통해 발급 수량 초과 방지
- 발급 성공 시 사용자 쿠폰 생성

#### 1.2 쿠폰 유효성 검증

- 주문 생성 시 쿠폰 사용 가능 여부 검증
- 유효기간, 사용 여부, 최소 주문 금액 확인
- 이미 사용된 쿠폰이나 만료된 쿠폰 사용 차단

#### 1.3 쿠폰 사용 이력 관리

- 쿠폰 사용 시 이력 기록 생성
- 주문 취소 시 쿠폰 복구 처리
- 사용자별 쿠폰 사용 히스토리 조회

---

## API 요약

### 쿠폰 관리 API

| Method | Endpoint                    | 설명                | 주요 기능                            |
| ------ | --------------------------- | ------------------- | ------------------------------------ |
| `POST` | `/coupons/:couponId/issue`  | 선착순 쿠폰 발급    | 한정 수량 쿠폰 발급, 동시성 제어     |
| `GET`  | `/users/me/coupons`         | 내 쿠폰 목록 조회   | 발급받은 쿠폰 목록 및 사용 가능 여부 |
| `GET`  | `/users/me/coupons/history` | 쿠폰 사용 이력 조회 | 사용한 쿠폰 내역 및 할인 금액        |

---

## 요청/응답 예시

### 1. 선착순 쿠폰 발급

**Request**

```json
POST /coupons/1/issue

{
  "userId": 100
}
```

**Response (성공)**

```json
{
  "userCouponId": 1,
  "coupon": {
    "id": 1,
    "name": "신규 가입 10% 할인",
    "discountType": "PERCENTAGE",
    "discountValue": 10,
    "maxDiscountAmount": 10000,
    "minOrderAmount": 30000,
    "expiresAt": "2025-11-28T23:59:59Z"
  },
  "issuedAt": "2025-10-28T10:30:00Z",
  "expiresAt": "2025-11-28T23:59:59Z",
  "isUsed": false,
  "remainingQuantity": 49,
  "message": "쿠폰이 발급되었습니다"
}
```

**Response (발급 실패 - 수량 소진)**

```json
{
  "errorCode": "COUPON_OUT_OF_STOCK",
  "message": "쿠폰 발급 수량이 모두 소진되었습니다",
  "couponName": "신규 가입 10% 할인",
  "totalQuantity": 50,
  "issuedQuantity": 50
}
```

### 2. 내 쿠폰 목록 조회

**Request**

```http
GET /users/me/coupons?status=AVAILABLE
```

**Response**

```json
{
  "coupons": [
    {
      "userCouponId": 1,
      "coupon": {
        "id": 1,
        "name": "신규 가입 10% 할인",
        "discountType": "PERCENTAGE",
        "discountValue": 10,
        "maxDiscountAmount": 10000,
        "minOrderAmount": 30000
      },
      "issuedAt": "2025-10-28T10:30:00Z",
      "expiresAt": "2025-11-28T23:59:59Z",
      "isUsed": false,
      "isExpired": false,
      "canUse": true
    },
    {
      "userCouponId": 2,
      "coupon": {
        "id": 2,
        "name": "첫 구매 5000원 할인",
        "discountType": "FIXED",
        "discountValue": 5000,
        "minOrderAmount": 50000
      },
      "issuedAt": "2025-10-27T15:00:00Z",
      "expiresAt": "2025-11-27T23:59:59Z",
      "isUsed": false,
      "isExpired": false,
      "canUse": true
    }
  ],
  "totalCount": 2,
  "availableCount": 2,
  "usedCount": 0,
  "expiredCount": 0
}
```

**참고**

- `status` 쿼리 파라미터: `AVAILABLE` (사용 가능), `USED` (사용됨), `EXPIRED` (만료됨), `ALL` (전체)
- `canUse` 필드: 현재 사용 가능 여부 (만료되지 않았고, 사용하지 않음)
- 주문 생성 시 사용 가능한 쿠폰 목록을 보여줄 때 활용

### 3. 쿠폰 사용 이력 조회

**Request**

```json
GET /users/me/coupons/history?page=1&limit=10
```

**Response**

```json
{
  "history": [
    {
      "userCouponId": 5,
      "coupon": {
        "id": 1,
        "name": "신규 가입 10% 할인",
        "discountType": "PERCENTAGE",
        "discountValue": 10
      },
      "issuedAt": "2025-10-28T10:30:00Z",
      "usedAt": "2025-10-28T14:30:00Z"
    },
    {
      "userCouponId": 3,
      "coupon": {
        "id": 2,
        "name": "첫 구매 5000원 할인",
        "discountType": "FIXED",
        "discountValue": 5000
      },
      "issuedAt": "2025-10-27T15:00:00Z",
      "usedAt": "2025-10-27T18:20:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalCount": 2,
    "limit": 10
  }
}
```
