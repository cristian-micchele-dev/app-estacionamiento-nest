import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserOrmEntity, UserRole } from '../infrastructure/orm/user.orm-entity';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  deletedAt: Date | null;

  static from(user: UserOrmEntity): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      deletedAt: user.deletedAt ?? null,
    };
  }
}
