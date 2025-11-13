import { SetMetadata } from '@nestjs/common';

export const TRANSACTIONAL_KEY = Symbol('TRANSACTIONAL_KEY');

export const Transactional = (): MethodDecorator => SetMetadata(TRANSACTIONAL_KEY, true);
