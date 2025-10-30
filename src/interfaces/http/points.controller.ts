import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiChargeRequest,
  ApiGetBalance,
  ApiVerifyCharge,
} from './points.swagger';

@ApiTags('Points')
@Controller('points')
export class PointsController {
  @Get('balance')
  @ApiGetBalance()
  getBalance(@Query('userId') userId: string) {
    console.log('Received userId:', userId);
    return {
      userId: 1,
      balance: 50000,
    };
  }

  @Post('charge')
  @ApiChargeRequest()
  chargeRequest(@Body() body: { userId: number; amount: number }) {
    console.log('Received charge request:', body);
    return {
      chargeRequestId: '1234567890123456789',
      amount: 50000,
      status: 'PENDING',
      createdAt: '2025-10-28T11:00:00Z',
    };
  }

  @Post('charge/verify')
  @ApiVerifyCharge()
  verifyCharge(@Body() body: { paymentId: string; chargeRequestId: string }) {
    console.log('Received verify request:', body);
    return {
      chargeRequestId: '1234567890123456789',
      status: 'COMPLETED',
      amount: 50000,
      previousBalance: 20000,
      currentBalance: 70000,
    };
  }
}
