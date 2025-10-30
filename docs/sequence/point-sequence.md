# 포인트 시퀀스 다이어그램

## 1. 포인트 잔액 조회 (GET /points/balance)

```mermaid
sequenceDiagram
    actor User as 사용자
    participant Controller as PointController
    participant UseCase as QueryPointBalance
    participant DomainService as PointService
    participant Repo as IPointRepository

    User->>Controller: GET /points/balance
    Controller->>UseCase: query(userId)
    UseCase->>DomainService: getBalance(userId)
    DomainService->>Repo: findBalanceByUserId(userId)
    Repo-->>DomainService: PointBalance
    DomainService-->>UseCase: PointBalance
    UseCase-->>Controller: PointBalance
    Controller-->>User: 200 OK + Balance Data
```

## 2. 포인트 충전 요청 생성 (POST /points/charge)

```mermaid
sequenceDiagram
    actor User as 사용자
    participant Controller as PointController
    participant UseCase as CreateChargeRequestCommand
    participant DomainService as PointService
    participant Repo as IPointRepository

    User->>Controller: POST /points/charge
    Controller->>UseCase: execute(userId, amount)
    UseCase->>DomainService: createChargeRequest(userId, amount)

    Note over DomainService: 충전 금액 검증<br/>(1,000원 ~ 2,000,000원)

    DomainService->>DomainService: generateSnowflakeId()

    Note over DomainService: Snowflake ID 발급

    DomainService->>Repo: saveChargeRequest(chargeRequest)
    Repo-->>DomainService: ChargeRequest (PENDING)
    DomainService-->>UseCase: ChargeRequest
    UseCase-->>Controller: ChargeRequest
    Controller-->>User: 201 Created + ChargeRequest Data

    Note over User: 클라이언트가<br/>MOCK PG로 결제 진행
```

## 3. 포인트 충전 검증 및 완료 (POST /points/charge/verify)

```mermaid
sequenceDiagram
    actor User as 사용자
    participant Controller as PointController
    participant UseCase as VerifyChargeCommand
    participant DomainService as PointService
    participant PGClient as MockPGClient
    participant Repo as IPointRepository

    User->>Controller: POST /points/charge/verify
    Controller->>UseCase: execute(chargeRequestId, paymentId)
    UseCase->>DomainService: verifyAndCompleteCharge(chargeRequestId, paymentId)

    Note over DomainService: 트랜잭션 시작

    DomainService->>Repo: findChargeRequestById(chargeRequestId)
    Repo-->>DomainService: ChargeRequest

    Note over DomainService: 중복 충전 방지<br/>(멱등성 체크)

    alt 이미 완료된 요청
        DomainService-->>UseCase: 기존 완료 결과 반환
        UseCase-->>Controller: ChargeResult
        Controller-->>User: 200 OK (멱등성 보장)
    else 신규 처리
        DomainService->>PGClient: getPaymentInfo(paymentId)
        PGClient-->>DomainService: PaymentInfo

        Note over DomainService: 금액 일치 확인<br/>chargeRequest.amount<br/>== payment.amount

        alt 금액 불일치
            DomainService-->>UseCase: throw AmountMismatchException
            UseCase-->>Controller: throw AmountMismatchException
            Controller-->>User: 400 Bad Request
        else 금액 일치
            DomainService->>Repo: findBalanceByUserId(userId)
            Repo-->>DomainService: PointBalance

            Note over DomainService: 포인트 잔액 업데이트<br/>balance + amount

            DomainService->>Repo: updateBalance(userId, newBalance)
            Repo-->>DomainService: PointBalance (updated)

            Note over DomainService: 거래 내역 생성<br/>type: CHARGE

            DomainService->>Repo: createTransaction(transaction)
            Repo-->>DomainService: PointTransaction

            Note over DomainService: 충전 요청 완료 처리<br/>status: COMPLETED

            DomainService->>Repo: updateChargeRequestStatus(chargeRequestId, COMPLETED)
            Repo-->>DomainService: ChargeRequest (COMPLETED)

            Note over DomainService: 트랜잭션 커밋

            DomainService-->>UseCase: ChargeResult
            UseCase-->>Controller: ChargeResult
            Controller-->>User: 200 OK + Charge Result
        end
    end
```

## 주요 특징

### 레이어 구조
- **Controller (Presentation)**: HTTP 요청/응답 처리, Domain → DTO 변환
- **UseCase (Application)**: 비즈니스 플로우 조율, 트랜잭션 경계
- **DomainService (Domain)**: 도메인 로직, 비즈니스 규칙 검증, Snowflake ID 생성
- **Repository (Infrastructure)**: 데이터 영속성, Prisma ↔ Domain 변환

### 도메인 모델
- **PointBalance**: 사용자별 포인트 잔액
- **ChargeRequest**: 포인트 충전 요청 (Snowflake ID, 금액, 상태)
- **PointTransaction**: 포인트 거래 내역 (CHARGE, USE)

### 비즈니스 규칙

#### 충전 금액 검증
- 최소 충전 금액: 1,000원
- 최대 충전 금액: 2,000,000원
- 원 단위 (소수점 불가)

#### Snowflake ID
- 분산 환경에서 고유 ID 생성
- 충전 요청 식별자로 사용

#### 멱등성 보장
- 동일한 충전 요청 ID로 중복 검증 시
- 기존 완료 결과 반환 (재처리 방지)

#### PG 결제 검증
- MOCK PG API로 실제 결제 금액 조회
- 충전 요청 금액과 PG 결제 금액 일치 확인
- 불일치 시 400 Bad Request

#### 트랜잭션 처리
- 포인트 잔액 업데이트
- 거래 내역 생성
- 충전 요청 상태 변경
- 모두 원자적으로 처리 (All or Nothing)

### 에러 처리

- **충전 금액 범위 초과**: 400 Bad Request
- **존재하지 않는 충전 요청**: 404 Not Found
- **금액 불일치**: 400 Bad Request (AMOUNT_MISMATCH)
- **네트워크 오류**: PG 대사를 통한 수동 복구 필요
