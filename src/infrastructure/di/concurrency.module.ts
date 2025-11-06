import { Global, Module } from '@nestjs/common';
import { UserMutexService } from '@/application/user-mutex.service';

/**
 * 동시성 제어를 위한 전역 모듈
 *
 * UserMutexService를 전역으로 제공하여
 * 모든 모듈에서 같은 인스턴스를 공유하도록 합니다.
 */
@Global()
@Module({
  providers: [UserMutexService],
  exports: [UserMutexService],
})
export class ConcurrencyModule {}
