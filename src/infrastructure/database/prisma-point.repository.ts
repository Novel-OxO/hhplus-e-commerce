import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@/common/exceptions';
import { ChargeStatus } from '@/domain/point/charge-status.vo';
import { PointBalance } from '@/domain/point/point-balance.entity';
import { PointChargeRequest } from '@/domain/point/point-charge-request.entity';
import { PointTransaction } from '@/domain/point/point-transaction.entity';
import { PointRepository } from '@/domain/point/point.repository';
import { Point } from '@/domain/point/point.vo';
import { PrismaProvider } from './prisma-provider.service';

@Injectable()
export class PrismaPointRepository implements PointRepository {
  constructor(private readonly prismaProvider: PrismaProvider) {}

  async findBalanceByUserId(userId: number): Promise<PointBalance | null> {
    const prisma = this.prismaProvider.get();
    const balance = await prisma.pointBalance.findUnique({
      where: { userId: BigInt(userId) },
    });

    if (!balance) {
      return null;
    }

    return this.toPointBalance(balance);
  }

  async findBalanceByUserIdOrElseThrow(userId: number): Promise<PointBalance> {
    const balance = await this.findBalanceByUserId(userId);

    if (!balance) {
      throw new NotFoundException(`포인트 잔액을 찾을 수 없습니다. userId: ${userId}`);
    }

    return balance;
  }

  async saveBalance(balance: PointBalance): Promise<PointBalance> {
    const prisma = this.prismaProvider.get();
    const saved = await prisma.pointBalance.upsert({
      where: { userId: BigInt(balance.getUserId()) },
      create: {
        userId: BigInt(balance.getUserId()),
        balance: balance.getBalance().getValue(),
        updatedAt: balance.getUpdatedAt(),
      },
      update: {
        balance: balance.getBalance().getValue(),
        updatedAt: balance.getUpdatedAt(),
      },
    });

    return this.toPointBalance(saved);
  }

  async saveChargeRequest(chargeRequest: PointChargeRequest): Promise<PointChargeRequest> {
    const prisma = this.prismaProvider.get();
    const saved = await prisma.pointChargeRequest.create({
      data: {
        userId: BigInt(chargeRequest.getUserId()),
        amount: chargeRequest.getAmount().getValue(),
        status: chargeRequest.getStatus() as any,
        createdAt: chargeRequest.getCreatedAt(),
        completedAt: chargeRequest.getCompletedAt(),
      },
    });

    return this.toPointChargeRequest(saved);
  }

  async findChargeRequestById(chargeRequestId: number): Promise<PointChargeRequest | null> {
    const prisma = this.prismaProvider.get();
    const chargeRequest = await prisma.pointChargeRequest.findUnique({
      where: { chargeRequestId: BigInt(chargeRequestId) },
    });

    if (!chargeRequest) {
      return null;
    }

    return this.toPointChargeRequest(chargeRequest);
  }

  async findChargeRequestByIdOrElseThrow(chargeRequestId: number): Promise<PointChargeRequest> {
    const chargeRequest = await this.findChargeRequestById(chargeRequestId);

    if (!chargeRequest) {
      throw new NotFoundException(`충전 요청을 찾을 수 없습니다. chargeRequestId: ${chargeRequestId}`);
    }

    return chargeRequest;
  }

  async createTransaction(transaction: PointTransaction): Promise<PointTransaction> {
    const prisma = this.prismaProvider.get();
    const saved = await prisma.pointTransaction.create({
      data: {
        userId: BigInt(transaction.getUserId()),
        transactionType: transaction.getTransactionType() as any,
        amount: transaction.getAmount(),
        balanceAfter: transaction.getBalanceAfter(),
        referenceId: BigInt(0), // TODO: 적절한 referenceId 설정 필요
        createdAt: transaction.getCreatedAt(),
      },
    });

    return this.toPointTransaction(saved);
  }

  async updateChargeRequestStatus(chargeRequestId: number, status: ChargeStatus): Promise<PointChargeRequest> {
    const prisma = this.prismaProvider.get();
    const updated = await prisma.pointChargeRequest.update({
      where: { chargeRequestId: BigInt(chargeRequestId) },
      data: {
        status: status as any,
        completedAt: status === ChargeStatus.COMPLETED || status === ChargeStatus.FAILED ? new Date() : null,
      },
    });

    return this.toPointChargeRequest(updated);
  }

  private toPointBalance(balance: {
    userId: bigint;
    balance: any; // Prisma Decimal type
    updatedAt: Date;
  }): PointBalance {
    return new PointBalance(Number(balance.userId), new Point(Number(balance.balance)), balance.updatedAt);
  }

  private toPointChargeRequest(chargeRequest: {
    chargeRequestId: bigint;
    userId: bigint;
    amount: any; // Prisma Decimal type
    status: string;
    createdAt: Date;
    completedAt: Date | null;
  }): PointChargeRequest {
    return new PointChargeRequest(
      Number(chargeRequest.userId),
      new Point(Number(chargeRequest.amount)),
      chargeRequest.createdAt,
      chargeRequest.status as ChargeStatus,
      chargeRequest.completedAt,
      Number(chargeRequest.chargeRequestId),
    );
  }

  private toPointTransaction(transaction: {
    transactionId: bigint;
    userId: bigint;
    transactionType: string;
    amount: any; // Prisma Decimal type
    balanceAfter: any; // Prisma Decimal type
    createdAt: Date;
  }): PointTransaction {
    return new PointTransaction(
      Number(transaction.userId),
      transaction.transactionType as any,
      Number(transaction.amount),
      Number(transaction.balanceAfter),
      transaction.createdAt,
      String(transaction.transactionId),
    );
  }
}
