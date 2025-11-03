export class GetBalanceResponseDto {
  userId: string;
  balance: number;
}

export class ChargeRequestResponseDto {
  chargeRequestId: string;
  amount: number;
  status: string;
  createdAt: string;
}

export class VerifyChargeResponseDto {
  chargeRequestId: string;
  status: string;
  amount: number;
  previousBalance: number;
  currentBalance: number;
}
