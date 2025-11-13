import { INestApplication } from '@nestjs/common';
import { Type } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import configuration from '@/common/config/configuration';
import { validationSchema } from '@/common/config/env.validation';
import { HttpExceptionFilter } from '@/common/exceptions/http-exception.filter';
import { TransactionModule } from '@/common/transaction/transaction.module';
import { PrismaModule } from '@/infrastructure/di/prisma.module';

export class TestAppBuilder {
  private modules: Type<any>[] = [];

  addModule(module: Type<any>): this {
    this.modules.push(module);
    return this;
  }

  async build(): Promise<INestApplication> {
    const imports = [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [configuration],
        validationSchema,
        envFilePath: `.env.${process.env.NODE_ENV || 'test'}`,
      }),
      PrismaModule,
      TransactionModule,
      ScheduleModule.forRoot(),
      ...this.modules,
    ];

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports,
    }).compile();

    const app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    return app;
  }
}
