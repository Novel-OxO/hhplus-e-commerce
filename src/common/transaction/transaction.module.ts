import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { TransactionManager } from './transaction.manager';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [TransactionManager],
  exports: [],
})
export class TransactionModule {}
