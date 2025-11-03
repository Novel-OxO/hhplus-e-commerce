import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@/common/exceptions';
import { PaymentStatus } from '@/domain/payment/payment-status.vo';
import { PGClient } from '@/domain/payment/pg-client.interface';
import { PGPaymentInfo } from '@/domain/payment/pg-payment-info.vo';
import { Point } from '@/domain/point/point.vo';

@Injectable()
export class MockPGClient implements PGClient {
  private readonly payments = new Map<string, PGPaymentInfo>();

  getPaymentInfo(paymentId: string): Promise<PGPaymentInfo> {
    const payment = this.payments.get(paymentId);

    if (!payment) {
      throw new NotFoundException(`결제 정보를 찾을 수 없습니다. paymentId: ${paymentId}`);
    }

    return Promise.resolve(payment);
  }

  mockPayment(paymentId: string, amount: number, status: PaymentStatus = PaymentStatus.SUCCESS): void {
    const paymentInfo = new PGPaymentInfo(paymentId, new Point(amount), status, new Date());
    this.payments.set(paymentId, paymentInfo);
  }

  clearPayments(): void {
    this.payments.clear();
  }
}
