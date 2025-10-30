import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';

export const ApiGetBalance = () =>
  applyDecorators(
    ApiOperation({ summary: '포인트 잔액 조회' }),
    ApiQuery({ name: 'userId', description: '사용자 ID', example: 1 }),
    ApiResponse({
      status: 200,
      description: '포인트 잔액 조회 성공',
      schema: {
        properties: {
          userId: { type: 'number', example: 1 },
          balance: { type: 'number', example: 50000 },
        },
      },
    }),
  );

export const ApiChargeRequest = () =>
  applyDecorators(
    ApiOperation({ summary: '포인트 충전 요청 생성' }),
    ApiBody({
      schema: {
        properties: {
          userId: { type: 'number', example: 1 },
          amount: { type: 'number', example: 50000 },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: '충전 요청 생성 성공',
      schema: {
        properties: {
          chargeRequestId: { type: 'string', example: '1234567890123456789' },
          amount: { type: 'number', example: 50000 },
          status: { type: 'string', example: 'PENDING' },
          createdAt: { type: 'string', example: '2025-10-28T11:00:00Z' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '충전 금액 범위 오류',
    }),
  );

export const ApiVerifyCharge = () =>
  applyDecorators(
    ApiOperation({ summary: '포인트 충전 검증 및 완료' }),
    ApiBody({
      schema: {
        properties: {
          paymentId: { type: 'string', example: 'payment_1234567890' },
          chargeRequestId: { type: 'string', example: '1234567890123456789' },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: '충전 검증 및 완료 성공',
      schema: {
        properties: {
          chargeRequestId: { type: 'string', example: '1234567890123456789' },
          status: { type: 'string', example: 'COMPLETED' },
          amount: { type: 'number', example: 50000 },
          previousBalance: { type: 'number', example: 20000 },
          currentBalance: { type: 'number', example: 70000 },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '충전 검증 실패 (존재하지 않는 요청, 중복 충전, 금액 불일치 등)',
    }),
  );
