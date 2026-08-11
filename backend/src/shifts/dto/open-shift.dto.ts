import { IsNumber, Min } from 'class-validator';

export class OpenShiftDto {
  @IsNumber()
  @Min(0)
  openingBalance: number;
}
