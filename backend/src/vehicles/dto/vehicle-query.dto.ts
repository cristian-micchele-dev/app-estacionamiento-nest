import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { VehicleType } from '../infrastructure/orm/vehicle.orm-entity';

export class VehicleQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(VehicleType)
  type?: VehicleType;
}
