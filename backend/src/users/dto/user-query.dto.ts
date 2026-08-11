import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { UserRole } from '../infrastructure/orm/user.orm-entity';

export class UserQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  isActive?: string;
}
