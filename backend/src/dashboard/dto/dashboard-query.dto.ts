import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class DashboardQueryDto {
  @IsIn(['day', 'week', 'month'])
  period: 'day' | 'week' | 'month';

  @IsOptional()
  @IsDateString()
  date?: string;
}
