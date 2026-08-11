import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { SpaceType } from '../infrastructure/orm/parking-space.orm-entity';

export class CreateSpaceDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  @Transform(({ value }) => String(value).toUpperCase())
  code: string;

  @IsEnum(SpaceType)
  @IsOptional()
  type?: SpaceType;
}
