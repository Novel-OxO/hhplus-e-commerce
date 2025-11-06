import { Mutex } from 'async-mutex';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserMutexService {
  private readonly userMutexes = new Map<string, Mutex>();
  private readonly cleanupInterval = 5 * 60 * 1000; // 5분
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.startCleanup();
  }

  async withUserLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
    const mutex = this.getMutex(userId);
    const release = await mutex.acquire();

    try {
      return await fn();
    } finally {
      release();
    }
  }

  private getMutex(userId: string): Mutex {
    if (!this.userMutexes.has(userId)) {
      this.userMutexes.set(userId, new Mutex());
    }
    return this.userMutexes.get(userId)!;
  }

  private cleanup(): void {
    for (const [userId, mutex] of this.userMutexes.entries()) {
      if (!mutex.isLocked()) {
        this.userMutexes.delete(userId);
      }
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  getMutexCount(): number {
    return this.userMutexes.size;
  }
}
