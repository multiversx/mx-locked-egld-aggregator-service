import { ApiProperty } from '@nestjs/swagger';

export class TimeCoordinates {
  constructor(init?: Partial<TimeCoordinates>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: Number })
  epoch: number = 0;

  @ApiProperty({ type: String })
  timestamp: string = '';
}
