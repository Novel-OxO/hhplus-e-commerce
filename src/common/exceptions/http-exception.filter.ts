import { Response } from 'express';
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { BaseException } from './base.exception';

@Catch(BaseException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: BaseException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(exception.statusCode).json({
      statusCode: exception.statusCode,
      message: exception.message,
    });
  }
}
