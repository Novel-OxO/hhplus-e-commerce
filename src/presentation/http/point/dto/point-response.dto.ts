export class GetBalanceResponseDto {
  userId: number;
  balance: number;
}

export class ChargeRequestResponseDto {
  chargeRequestId: number;
  amount: number;
  status: string;
  createdAt: string;
}

export class VerifyChargeResponseDto {
  chargeRequestId: number;
  status: string;
  amount: number;
  previousBalance: number;
  currentBalance: number;
}
