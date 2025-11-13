import { AsyncLocalStorage } from 'node:async_hooks';
import { Prisma, PrismaClient } from '@prisma/client';
import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export const TRANSACTION_STORAGE = Symbol('TRANSACTION_STORAGE');

@Injectable()
export class PrismaProvider {
  constructor(
    private readonly prismaClient: PrismaService,
    @Inject(TRANSACTION_STORAGE)
    private readonly asyncLocalStorage: AsyncLocalStorage<{ txClient?: Prisma.TransactionClient }>,
  ) {}

  get(): Prisma.TransactionClient | PrismaClient {
    const store = this.asyncLocalStorage.getStore();
    return store?.txClient || this.prismaClient;
  }

  async beginTransaction<T>(fn: () => Promise<T>): Promise<T> {
    const store = this.asyncLocalStorage.getStore();
    // 이미 트랜잭션 컨텍스트가 있으면 중첩 트랜잭션으로 처리
    if (store?.txClient) {
      return fn();
    }

    return this.prismaClient.$transaction(async (txClient) => {
      return this.asyncLocalStorage.run({ txClient }, fn);
    });
  }
}
