import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { TRANSACTIONAL_KEY } from '@/common/decorators/transactional.decorator';
import { PrismaProvider } from '@/infrastructure/database/prisma-provider.service';

const TRANSACTIONAL_WRAPPED_FLAG = '__transactionalWrapped';

@Injectable()
export class TransactionManager implements OnModuleInit {
  private readonly metadataScanner = new MetadataScanner();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly prismaProvider: PrismaProvider,
  ) {}

  onModuleInit(): void {
    this.wrapTransactionalMethods();
  }

  private wrapTransactionalMethods(): void {
    const providers = this.discoveryService
      .getProviders()
      .filter((wrapper) => wrapper && wrapper.instance)
      .filter((wrapper) => Object.getPrototypeOf(wrapper.instance))
      .filter((wrapper) => wrapper.instance !== this);

    providers.forEach(({ instance }) => {
      const prototype = Object.getPrototypeOf(instance);
      if (!prototype || prototype === Object.prototype) {
        return;
      }

      const methodNames = this.metadataScanner.getAllMethodNames(prototype);

      methodNames.forEach((methodName) => {
        const descriptor = Object.getOwnPropertyDescriptor(prototype, methodName);
        if (!descriptor || typeof descriptor.value !== 'function') {
          return;
        }

        const originalMethod = descriptor.value;
        const isTransactional = this.reflector.get<boolean>(TRANSACTIONAL_KEY, originalMethod);

        if (!isTransactional) {
          return;
        }

        const currentMethod = instance[methodName];
        if (currentMethod && currentMethod[TRANSACTIONAL_WRAPPED_FLAG]) {
          return;
        }

        const wrappedMethod = this.createTransactionalWrapper(originalMethod);
        Object.defineProperty(wrappedMethod, TRANSACTIONAL_WRAPPED_FLAG, {
          value: true,
          writable: false,
          enumerable: false,
          configurable: false,
        });

        instance[methodName] = wrappedMethod;
      });
    });
  }

  private createTransactionalWrapper(originalMethod: (...args: any[]) => any) {
    const prismaProvider = this.prismaProvider;

    return function (this: unknown, ...args: unknown[]) {
      return prismaProvider.beginTransaction(async () => {
        return await originalMethod.apply(this, args);
      });
    };
  }
}
