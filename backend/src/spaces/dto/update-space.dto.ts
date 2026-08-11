import { IsEnum, IsOptional } from 'class-validator';
import {
  SpaceStatus,
  SpaceType,
} from '../infrastructure/orm/parking-space.orm-entity';

export class UpdateSpaceDto {
  @IsEnum(SpaceType)
  @IsOptional()
  type?: SpaceType;

  @IsEnum(SpaceStatus)
  @IsOptional()
  status?: SpaceStatus;
}
