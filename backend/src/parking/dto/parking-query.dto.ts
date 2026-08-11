import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { SessionStatus } from '../infrastructure/orm/parking-session.orm-entity';

export class ParkingQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;
}
