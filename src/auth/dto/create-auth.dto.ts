import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AppRole } from 'src/users/entities/user.entity';

export class updateProfileDto {
  @ApiProperty({ example: 'John Doe', description: 'Admin Full name' })
  @IsString()
  fullname: string;

  @ApiProperty({ example: 'admin@example.com', description: 'User email' })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password!123', description: 'User password' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ example: 'ADMIN', description: '' })
  @IsString()
  role?: AppRole;

  @ApiProperty({
    example: 'https://cloudinary.com',
    description: 'user picture',
  })
  @IsString()
  picture: string;

  @ApiProperty({
    example: 'active',
    description: 'user status',
  })
  @IsString()
  status: string;
}

export class changePasswordDTO {
  @ApiProperty({ example: 'Password123', description: 'old password' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'Password444', description: 'new password' })
  @IsString()
  newPassword: string;
}

export class registerDTO {
  @ApiProperty({ example: 'John Doe', description: 'Admin Full name' })
  @IsString()
  fullname?: string;

  @ApiProperty({ example: 'admin@examplemail.com', description: 'User email' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'ADMIN', description: '' })
  @IsString()
  role?: AppRole;

  @ApiProperty({example: 'active', description: 'user status' })
  @IsString()
  status?: string;
}

export class loginDTO {
  @ApiProperty({ example: 'admin@example.com', description: 'User email' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'Password123', description: 'User password' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}

export class BaseResponseTypeDTO {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ enum: HttpStatus, default: HttpStatus.OK })
  code: HttpStatus;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data?: any;

  @ApiProperty()
  totalCount?: number;

  @ApiProperty()
  limit?: number;

  @ApiProperty()
  page?: number;

  @ApiProperty()
  search?: string;
}
