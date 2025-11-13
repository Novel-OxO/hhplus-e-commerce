## 상품 옵션 조회

```sql
EXPLAIN SELECT
     po.product_option_id,
     po.product_id,
     po.option_name,
     po.sku,
     po.stock_quantity,
     po.created_at,
     po.updated_at,
     p.product_id,
     p.product_name,
     p.description,
     p.base_price,
     p.created_at,
     p.updated_at
   FROM product_options po
   INNER JOIN products p ON po.product_id = p.product_id
   WHERE po.product_option_id IN (31, 32,33);
```

### 실행 계획 분석

#### 1. product_options 테이블 (po)

- **인덱스**: `PRIMARY` 키 사용
- **스캔 방식**: `range` - PRIMARY 키를 사용한 범위 스캔
- **추가 정보**: `Using where` - WHERE 절 조건 적용

#### 2. products 테이블 (p)

- **인덱스**: `PRIMARY` 키 사용
- **스캔 방식**: `eq_ref` - PRIMARY 키를 사용한 고유 조인 (가장 효율적인 조인 방식)
- **조인 키**: `po.product_id`를 사용하여 products 테이블의 PRIMARY 키와 조인

---

## 포인트 잔액 조회

```sql
EXPLAIN
SELECT user_id, balance, updated_at
FROM point_balances
WHERE user_id = 31;
```

### 실행 계획 분석

#### 1. point_balances 테이블

- **인덱스**: `PRIMARY` 키 사용
- **스캔 방식**: `const` - PRIMARY 키를 사용한 상수 조회

## 사용자 쿠폰 조회

```sql
EXPLAIN SELECT
     uc.user_coupon_id,
     uc.user_id,
     uc.coupon_id,
     uc.order_id,
     uc.issued_at,
     uc.expires_at,
     uc.used_at,
     c.coupon_id,
     c.coupon_name,
     c.discount_type,
     c.discount_value,
     c.max_discount_amount,
     c.min_order_amount,
     c.total_quantity,
     c.issued_quantity,
     c.valid_from,
     c.valid_until,
     c.created_at,
     c.updated_at
   FROM user_coupons uc
   INNER JOIN coupons c ON uc.coupon_id = c.coupon_id
   WHERE uc.user_coupon_id = 31;
```

### 실행 계획 분석

#### 1. user_coupons 테이블 (uc)

- **인덱스**: `PRIMARY` 키 사용
- **스캔 방식**: `const` - PRIMARY 키를 사용한 상수 조회

#### 2. coupons 테이블 (c)

- **인덱스**: `PRIMARY` 키 사용
- **스캔 방식**: `const` - PRIMARY 키를 사용한 상수 조회
- **조인 키**: `uc.coupon_id`를 사용하여 coupons 테이블의 PRIMARY 키와 조인

## 주문 조회

```sql
EXPLAIN
SELECT
      o.order_id,
      o.user_id,
      o.user_coupon_id,
      o.order_status,
      o.total_price,
      o.discount_price,
      o.final_price,
      o.created_at,
      o.updated_at,
      o.completed_at,
      o.cancelled_at,
      oi.order_item_id,
      oi.order_id,
      oi.product_option_id,
      oi.product_name,
      oi.option_name,
      oi.sku,
      oi.price,
      oi.quantity,
      oi.subtotal,
      oi.created_at
    FROM orders o
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.order_id = 31;
```

### 실행 계획 분석

#### 1. orders 테이블 (o)

- **인덱스**: `PRIMARY` 키 사용
- **스캔 방식**: `const` - PRIMARY 키를 사용한 상수 조회

#### 2. order_items 테이블 (oi)

- **인덱스**: `order_items_order_id_idx` 인덱스 사용
- **스캔 방식**: `ref` - 인덱스를 사용한 참조 조회
- **조인 키**: `o.order_id`를 사용하여 order_items 테이블의 `order_id` 인덱스와 조인

## 쿠폰 단건 조회

```sql
EXPLAIN
SELECT
     coupon_id AS couponId,
     coupon_name AS couponName,
     discount_type AS discountType,
     discount_value AS discountValue,
     max_discount_amount AS maxDiscountAmount,
     min_order_amount AS minOrderAmount,
     total_quantity AS totalQuantity,
     issued_quantity AS issuedQuantity,
     valid_from AS validFrom,
     valid_until AS validUntil,
     created_at AS createdAt,
     updated_at AS updatedAt
   FROM coupons
   WHERE coupon_id = 300
   FOR UPDATE
```

### 실행 계획 분석

#### 1. coupons 테이블

- **인덱스**: `PRIMARY` 키 사용
- **스캔 방식**: `const` - PRIMARY 키를 사용한 상수 조회

## 사용자 쿠폰 존재 여부 확인

```sql
EXPLAIN SELECT COUNT(*) as count
   FROM user_coupons
   WHERE coupon_id = 299 AND user_id = 300;
```

### 실행 계획 분석

#### 1. user_coupons 테이블

- **인덱스**: `user_coupons_user_id_idx` 인덱스 사용
- **스캔 방식**: `ref` - 인덱스를 사용한 참조 조회

## 사용가능한 사용자 쿠폰 목록 조회

```sql
EXPLAIN
SELECT
     uc.user_coupon_id,
     uc.user_id,
     uc.coupon_id,
     uc.order_id,
     uc.issued_at,
     uc.expires_at,
     uc.used_at,
     c.coupon_id,
     c.coupon_name,
     c.discount_type,
     c.discount_value,
     c.max_discount_amount,
     c.min_order_amount,
     c.total_quantity,
     c.issued_quantity,
     c.valid_from,
     c.valid_until,
     c.created_at,
     c.updated_at
   FROM user_coupons uc
   INNER JOIN coupons c ON uc.coupon_id = c.coupon_id
   WHERE uc.user_id = 310
     AND uc.used_at IS NULL
     AND uc.expires_at >= NOW()
   ORDER BY uc.issued_at DESC
```

### 실행 계획 분석

#### 1. user_coupons 테이블 (uc)

- **인덱스**: `user_coupons_user_id_idx` 인덱스 사용
- **스캔 방식**: `ref` - 인덱스를 사용한 참조 조회

#### 2. coupons 테이블 (c)

- **인덱스**: `PRIMARY` 키 사용
- **스캔 방식**: `eq_ref` - PRIMARY 키를 사용한 고유 조인 (가장 효율적인 조인 방식)
- **조인 키**: `uc.coupon_id`를 사용하여 coupons 테이블의 PRIMARY 키와 조인

## 장바구니 아이템 조회

```sql
EXPLAIN
SELECT
     ci.cart_item_id,
     ci.user_id,
     ci.product_option_id,
     ci.quantity,
     ci.price,
     ci.created_at,
     ci.updated_at,
     po.product_option_id,
     po.product_id,
     po.option_name,
     po.sku,
     po.stock_quantity,
     po.created_at,
     po.updated_at,
     p.product_id,
     p.product_name,
     p.description,
     p.base_price,
     p.created_at,
     p.updated_at
   FROM cart_items ci
   INNER JOIN product_options po ON ci.product_option_id = po.product_option_id
   INNER JOIN products p ON po.product_id = p.product_id
   WHERE ci.user_id = 309  AND ci.product_option_id = 310
   LIMIT 1
```

### 실행 계획 분석

#### 1. product_options 테이블 (po)

- **인덱스**: `PRIMARY` 키 사용
- **스캔 방식**: `const` - PRIMARY 키를 사용한 상수 조회

#### 2. products 테이블 (p)

- **인덱스**: `PRIMARY` 키 사용
- **스캔 방식**: `const` - PRIMARY 키를 사용한 상수 조회

#### 3. cart_items 테이블 (ci)

- **인덱스**: `cart_items_user_id_idx`
- **스캔 방식**: `ref` - 인덱스를 사용한 참조 조회

## 장바구니 리스트 조회

```sql
 EXPLAIN
   SELECT
     ci.cart_item_id,
     ci.user_id,
     ci.product_option_id,
     ci.quantity,
     ci.price,
     ci.created_at,
     ci.updated_at,
     po.product_option_id,
     po.product_id,
     po.option_name,
     po.sku,
     po.stock_quantity,
     po.created_at,
     po.updated_at,
     p.product_id,
     p.product_name,
     p.description,
     p.base_price,
     p.created_at,
     p.updated_at
   FROM cart_items ci
   INNER JOIN product_options po ON ci.product_option_id = po.product_option_id
   INNER JOIN products p ON po.product_id = p.product_id
   WHERE ci.user_id = 300
   ORDER BY ci.created_at DESC
```

### 실행 계획 분석

#### 1. cart_items 테이블 (ci)

- **인덱스**: `cart_items_user_id_idx` 인덱스 사용
- **스캔 방식**: `ref` - 인덱스를 사용한 참조 조회
- **추가 정보**: `Using filesort` - ORDER BY 절을 처리하기 위해 정렬 작업 수행

#### 2. product_options 테이블 (po)

- **인덱스**: `PRIMARY` 키 사용
- **스캔 방식**: `eq_ref` - PRIMARY 키를 사용한 고유 조인 (가장 효율적인 조인 방식)
- **조인 키**: `ci.product_option_id`를 사용하여 product_options 테이블의 PRIMARY 키와 조인

#### 3. products 테이블 (p)

- **인덱스**: `PRIMARY` 키 사용
- **스캔 방식**: `eq_ref` - PRIMARY 키를 사용한 고유 조인 (가장 효율적인 조인 방식)
- **조인 키**: `po.product_id`를 사용하여 products 테이블의 PRIMARY 키와 조인

## 충전 요청 조회

```sql
EXPLAIN
SELECT
     charge_request_id,
     user_id,
     amount,
     status,
     created_at,
     completed_at
FROM point_charge_requests
WHERE charge_request_id = ?
```

### 실행 계획 분석

#### 1. point_charge_requests 테이블

- **인덱스**: `PRIMARY` 키 사용
- **스캔 방식**: `const` - PRIMARY 키를 사용한 상수 조회

---

## 상품별 조회수

```sql
EXPLAIN
SELECT
     product_id,
     COUNT(product_id) as _count_productId
   FROM product_view_logs
   WHERE viewed_at >= ? AND viewed_at <= ?
   GROUP BY product_id
```

### 실행 계획 분석

#### 1. product_view_logs 테이블

- **인덱스**: `product_view_logs_viewed_at_idx` 인덱스 사용
- **스캔 방식**: `range` - 인덱스를 사용한 범위 스캔

## 랭킹 조회

```sql
EXPLAIN
SELECT
     pr.product_id,
     pr.total_views,
     pr.ranking_position,
     pr.calculated_at,
     p.product_id,
     p.product_name,
     p.description,
     p.base_price,
     p.created_at,
     p.updated_at
   FROM product_rankings pr
   INNER JOIN products p ON pr.product_id = p.product_id
   WHERE pr.calculated_at = '2025-01-02'
   ORDER BY pr.ranking_position ASC
   LIMIT 10
```

### 실행 계획 분석

#### 1. product_rankings 테이블 (pr)

- **인덱스**: `product_rankings_calculated_at_idx` 인덱스 사용
- **스캔 방식**: `ref` - 인덱스를 사용한 참조 조회
- **추가 정보**: `Using filesort` - ORDER BY 절을 처리하기 위해 정렬 작업 수행

#### 2. products 테이블 (p)

- **인덱스**: `PRIMARY` 키 사용
- **스캔 방식**: `eq_ref` - PRIMARY 키를 사용한 고유 조인 \
- **조인 키**: `pr.product_id`를 사용하여 products 테이블의 PRIMARY 키와 조인
