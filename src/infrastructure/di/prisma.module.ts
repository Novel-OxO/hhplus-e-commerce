import { AsyncLocalStorage } from 'node:async_hooks';
import { Prisma } from '@prisma/client';
import { Module, Global } from '@nestjs/common';
import { PrismaProvider, TRANSACTION_STORAGE } from '@/infrastructure/database/prisma-provider.service';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Global()
@Module({
  providers: [
    PrismaService,
    PrismaProvider,
    {
      provide: TRANSACTION_STORAGE,
      useValue: new AsyncLocalStorage<{ txClient?: Prisma.TransactionClient }>(),
    },
  ],
  exports: [PrismaService, PrismaProvider],
})
export class PrismaModule {}
