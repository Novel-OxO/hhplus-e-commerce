import { PGPaymentInfo } from './pg-payment-info.vo';

export const PG_CLIENT = Symbol('PGClient');

export interface PGClient {
  getPaymentInfo(paymentId: string): Promise<PGPaymentInfo>;
}
