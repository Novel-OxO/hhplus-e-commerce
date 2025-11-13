import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { StartedMySqlContainer, MySqlContainer } from '@testcontainers/mysql';

export class TestContainerManager {
  private static container: StartedMySqlContainer | null = null;
  private static prisma: PrismaClient | null = null;
  private static databaseUrl: string | null = null;
  private static isInitialized = false;

  static async start(): Promise<{ container: StartedMySqlContainer; prisma: PrismaClient; databaseUrl: string }> {
    if (this.isInitialized && this.container && this.prisma && this.databaseUrl) {
      return {
        container: this.container,
        prisma: this.prisma,
        databaseUrl: this.databaseUrl,
      };
    }

    // MySQL 테스트 컨테이너 시작
    this.container = await new MySqlContainer('mysql:8')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withUserPassword('test_password')
      .withRootPassword('test_root_password')
      .start();

    this.databaseUrl = this.container.getConnectionUri();

    // 환경 변수 설정
    process.env.DATABASE_URL = this.databaseUrl;
    process.env.NODE_ENV = 'test';

    // Prisma schema push
    try {
      execSync('npx prisma db push --skip-generate --accept-data-loss', {
        env: { ...process.env, DATABASE_URL: this.databaseUrl },
        stdio: 'pipe',
      });
    } catch (error) {
      console.error('Prisma db push failed:', error);
      throw error;
    }

    // Prisma Client 생성 및 연결
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.databaseUrl,
        },
      },
    });

    await this.prisma.$connect();
    this.isInitialized = true;

    return {
      container: this.container,
      prisma: this.prisma,
      databaseUrl: this.databaseUrl,
    };
  }

  static async stop(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
    }

    if (this.container) {
      await this.container.stop();
      this.container = null;
    }

    this.databaseUrl = null;
    this.isInitialized = false;
  }

  static getPrisma(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Test container is not initialized. Call start() first.');
    }
    return this.prisma;
  }

  static async cleanupDatabase(): Promise<void> {
    const prisma = this.getPrisma();
    // 외래키 제약 조건을 고려하여 역순으로 정리
    await prisma.couponUsageHistory.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.pointTransaction.deleteMany();
    await prisma.pointChargeRequest.deleteMany();
    await prisma.pointBalance.deleteMany();
    await prisma.userCoupon.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.productOption.deleteMany();
    await prisma.productViewLog.deleteMany();
    await prisma.productRanking.deleteMany();
    await prisma.product.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.user.deleteMany();
  }
}
