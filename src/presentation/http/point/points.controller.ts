import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PointService } from '@/application/point.service';
import { Point } from '@/domain/point/point.vo';
import { ApiChargeRequest, ApiGetBalance, ApiVerifyCharge } from '@/presentation/http/point/points.swagger';

@ApiTags('Points')
@Controller('points')
export class PointsController {
  constructor(private readonly pointService: PointService) {}

  @Get('balance')
  @ApiGetBalance()
  async getBalance(@Query('userId') userId: string) {
    const pointBalance = await this.pointService.getBalance(userId);
    return {
      userId: pointBalance.getUserId(),
      balance: pointBalance.getBalance().getValue(),
    };
  }

  @Post('charge')
  @ApiChargeRequest()
  async chargeRequest(@Body() body: { userId: string; amount: number }) {
    const point = new Point(body.amount);
    const chargeRequest = await this.pointService.createChargeRequest(body.userId, point);

    return {
      chargeRequestId: chargeRequest.getChargeRequestId(),
      amount: chargeRequest.getAmount().getValue(),
      status: chargeRequest.getStatus(),
      createdAt: chargeRequest.getCreatedAt().toISOString(),
    };
  }

  @Post('charge/verify')
  @ApiVerifyCharge()
  async verifyCharge(@Body() body: { paymentId: string; chargeRequestId: string }) {
    const result = await this.pointService.verifyAndCompleteCharge(body.chargeRequestId, body.paymentId);

    return {
      chargeRequestId: result.getChargeRequestId(),
      status: result.getStatus(),
      amount: result.getAmount().getValue(),
      previousBalance: result.getPreviousBalance().getValue(),
      currentBalance: result.getCurrentBalance().getValue(),
    };
  }
}
