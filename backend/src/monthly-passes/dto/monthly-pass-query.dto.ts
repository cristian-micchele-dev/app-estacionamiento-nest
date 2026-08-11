import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../shared/dto/pagination.dto';

export class MonthlyPassQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  active?: string;
}
