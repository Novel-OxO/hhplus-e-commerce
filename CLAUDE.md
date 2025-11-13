# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

이커머스 백엔드 시스템 (NestJS + TypeScript). 포인트 기반 결제 시스템으로 상품 주문, 장바구니, 쿠폰, 포인트 충전/사용 기능을 제공합니다.

## Development Commands

### Build & Run
```bash
npm run build              # 프로덕션 빌드
npm run start              # 프로덕션 모드 실행
npm run start:dev          # 개발 모드 실행 (watch)
npm run start:debug        # 디버그 모드 실행
```

### Testing
```bash
npm test                   # 전체 테스트 실행
npm run test:watch         # watch 모드로 테스트
npm run test:cov          # 커버리지 포함 테스트
npm run test:e2e          # E2E 테스트
npm run test:debug        # 디버그 모드로 테스트

# 특정 테스트 파일만 실행
npm test -- <파일경로>
# 예: npm test -- src/application/coupon.service.spec.ts

# 특정 describe 또는 it 블록만 실행
npm test -- -t "테스트명"
# 예: npm test -- -t "쿠폰 발급"
```

### Code Quality
```bash
npm run format            # Prettier 포맷팅
npm run lint              # ESLint 검사 및 자동 수정
```

### Database
```bash
# MySQL 8 컨테이너 시작
cd docker && docker compose up -d

# 컨테이너 정지
cd docker && docker compose down

# 데이터 초기화 (볼륨 삭제 포함)
cd docker && docker compose down -v

# Prisma 스키마 동기화
npm run prisma:generate    # Prisma Client 생성
npm run prisma:migrate     # 마이그레이션 실행
```

**Connection Info:**
- Host: localhost
- Port: 13306
- Database: hhplus_ecommerce
- User: hhplus
- Password: qwer1234

### Environment Variables
환경별 설정 파일:
- `.env` - 기본 (development)
- `.env.development` - 개발 환경
- `.env.test` - 테스트 환경
- `.env.production` - 프로덕션 환경

실행 시 환경 지정:
```bash
NODE_ENV=test npm run start:dev
NODE_ENV=production npm run start
```

## Architecture

### Layered Architecture (4-Layer)

```
presentation/    # HTTP 요청/응답 처리 (Controllers, DTOs)
    └── http/
application/     # 비즈니스 플로우 조율 (Services)
domain/          # 핵심 비즈니스 로직 (Entities, VOs, Repository Interfaces)
infrastructure/  # 외부 연동 (DB, 외부 API, ID 생성기)
    ├── di/           # NestJS 모듈 정의
    ├── persistence/  # Repository 구현 (현재 In-Memory, 향후 Prisma 연동)
    ├── database/     # DB 연결 설정 (PrismaService, PrismaModule)
    ├── external/     # 외부 API 연동
    └── id-generator/ # Snowflake ID 생성기
config/          # 환경 설정 (ConfigModule, Joi validation)
```

### Dependency Rule

- **의존성 방향**: Presentation → Application → Domain ← Infrastructure
- Domain 레이어는 다른 레이어에 의존하지 않음 (순수 비즈니스 로직)
- Infrastructure는 Domain의 인터페이스를 구현 (Repository 패턴)
- Application 레이어는 Domain의 Repository 인터페이스에만 의존

### Domain Layer Structure

각 도메인은 다음 구조를 따릅니다:

```
domain/
  └── {domain}/
      ├── *.entity.ts         # 엔티티 (ID, 비즈니스 로직)
      ├── *.vo.ts            # Value Object (불변 값 객체)
      └── *.repository.ts    # Repository 인터페이스
```

**주요 도메인:**
- `product/` - 상품, 상품 옵션, 상품 랭킹
- `cart/` - 장바구니
- `order/` - 주문, 주문 아이템
- `coupon/` - 쿠폰, 유저 쿠폰, 쿠폰 사용 내역
- `point/` - 포인트, 포인트 거래 내역, 포인트 충전
- `payment/` - PG 결제 (포인트 충전용)

### Key Design Patterns

**1. Value Object (VO) Pattern**
- 금액, 수량, 할인 값 등을 VO로 캡슐화
- 불변성 보장, 비즈니스 규칙 검증 포함
- 예: `Point`, `CouponQuantity`, `DiscountValue`, `ValidityPeriod`

**2. Repository Pattern**
- Domain 레이어에 인터페이스 정의 (예: `CouponRepository`)
- Infrastructure 레이어에서 구현 (예: `InMemoryCouponRepository`)
- Symbol 기반 의존성 주입: `@Inject(COUPON_REPOSITORY)`

**3. Snapshot Pattern (Order Item)**
- 주문 시점의 상품 정보를 스냅샷으로 저장
- 주문 후 상품 가격/정보 변경되어도 주문 내역 보존
- 저장 필드: `product_name`, `option_name`, `sku`, `price`, `quantity`, `subtotal`


## Important Business Rules

### Payment System
- **주문 결제**: 포인트만 사용 (외부 PG 없음)
- **포인트 충전**: Mock PG를 통해 결제 후 포인트 충전
- `Payment` 테이블은 포인트 충전 시 PG 결제 정보 저장용

### Coupon System
- 쿠폰 발급 시 동시성 제어 필수 
- 한정 수량 쿠폰: `CouponQuantity` VO로 재고 관리
- 쿠폰 사용: 주문 금액이 최소 주문 금액 이상이어야 함

### Point System
- 포인트 충전: `PointChargeRequest` → `Payment` → `PointTransaction`
- 포인트 사용: 주문 생성 시 차감 → `PointTransaction` 생성
- `PointBalance`: 사용자별 현재 잔액 관리

### Product Ranking
- 최근 3일간 조회수 기반 인기 상품 집계
- 배치 작업으로 사전 집계 (매일 자정 실행)
- `ProductRankingScheduler` → `ProductRankingService`

## Path Aliases

tsconfig.json에 정의된 경로 별칭:

```typescript
"@/*": ["src/*"]
"@interfaces/*": ["src/interfaces/*"]
"@domain/*": ["src/domain/*"]
"@infrastructure/*": ["src/infrastructure/*"]
"@presentation/*": ["src/presentation/*"]
"@application/*": ["src/application/*"]
```

## Database

### ORM: Prisma
- **Prisma Client**: 타입 안전한 쿼리 빌더
- **Schema 파일**: `prisma/schema.prisma`
- **Provider**: MySQL

### Primary Key Strategy
- **Snowflake ID (BIGINT)** 사용
- 향후 MSA 전환 시 분산 환경에서도 ID 충돌 없음
- `@grkndev/snowflakeid` 패키지 사용

### Key Relationships
- `users` ↔ `point_balances` (1:1)
- `users` → `orders` (1:N)
- `users` → `user_coupons` (1:N)
- `products` → `product_options` (1:N)
- `orders` → `order_items` (1:N)
- `orders` → `point_transactions` (1:N)

자세한 ERD는 [docs/database/erd.md](docs/database/erd.md) 참조

### PrismaService
- 위치: `src/infrastructure/database/prisma.service.ts`
- NestJS 라이프사이클 훅 구현 (`OnModuleInit`, `OnModuleDestroy`)
- 애플리케이션 시작 시 자동 연결, 종료 시 자동 해제
- `@Global()` 데코레이터로 전역 모듈 설정

## Testing Strategy

### Test Structure
```
test/
  ├── unit/          # 단위 테스트 (도메인 로직, 서비스)
  └── integration/   # 통합 테스트 (컨트롤러, 서비스, 레포지토리)
```

### Coverage Target
- Statement: 88%+
- Branch: 72%+
- Function: 78%+
- Line: 87%+

### Concurrency Testing
동시성 제어가 필요한 기능은 반드시 동시성 테스트 작성:
```typescript
// Promise.allSettled로 동시 요청 시뮬레이션
const results = await Promise.allSettled(
  users.map(userId => service.issueCoupon(couponId, userId))
);

// 성공/실패 개수 검증
const successCount = results.filter(r => r.status === 'fulfilled').length;
```

## Exception Handling

커스텀 예외 클래스 사용 (`src/common/exceptions/`):
- `BadRequestException` - 잘못된 요청 (400)
- `NotFoundException` - 리소스 없음 (404)
- `ConflictException` - 충돌 (409)
- `ForbiddenException` - 권한 없음 (403)

## Module Structure

NestJS 모듈은 `src/infrastructure/di/` 에서 관리:
- `app.module.ts` - 루트 모듈
- `coupons.module.ts` - 쿠폰 도메인 모듈
- `orders.module.ts` - 주문 도메인 모듈
- `points.module.ts` - 포인트 도메인 모듈
- `products.module.ts` - 상품 도메인 모듈
- `carts.module.ts` - 장바구니 도메인 모듈
- `concurrency.module.ts` - 동시성 제어 모듈 (UserMutexService)

각 모듈은 Controller, Service, Repository를 Provider로 등록합니다.

## Code Conventions

### Commit Messages (Korean)
conventional commit 형식 사용:
```
feat: 새 기능 추가
fix: 버그 수정
refactor: 리팩토링
test: 테스트 추가/수정
docs: 문서 수정
chore: 기타 작업 (빌드, 설정 등)
```

### Naming Conventions
- 파일명: kebab-case (예: `coupon.service.ts`)
- 클래스명: PascalCase (예: `CouponService`)
- 변수/함수: camelCase (예: `issueCoupon`)
- 상수: UPPER_SNAKE_CASE (예: `COUPON_REPOSITORY`)

### TypeScript Rules
- `noImplicitAny: false` (점진적 타입 적용)
- `strictNullChecks: true` (null 안전성 보장)
- Decorators 활성화 (NestJS 필수)
