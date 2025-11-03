import { generateSnowflakeId } from '@grkndev/snowflakeid';
import { Injectable } from '@nestjs/common';
import { IdGenerator } from './id-generator.interface';

@Injectable()
export class SnowflakeIdGenerator implements IdGenerator {
  private readonly nodeId: number;
  private readonly epoch: number;

  constructor() {
    // 환경변수로 관리 가능 (기본값: 1)
    this.nodeId = Number(process.env.NODE_ID) || 1;
    // 2021-01-01 00:00:00 UTC
    this.epoch = 1609459200000;
  }

  generate(): string {
    return generateSnowflakeId({
      nodeId: this.nodeId,
      epoch: this.epoch,
    });
  }
}
