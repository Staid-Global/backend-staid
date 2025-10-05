import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CreateEmaildirectoryDto {
  @ApiProperty({
    example: 'John',
    description: '',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'john@staid.com',
    description: '',
  })
  @IsString()
  @IsEmail()
  company_email: string;

  @ApiProperty({
    example: '689f3dd079974d2293cb94f4',
    description: 'Selected Company_id',
  })
  @IsString()
  company: string;

  @ApiProperty({
    example: '+1-212-555-0198',
    description: '',
  })
  @IsString()
  officeNumber: string;

  @ApiProperty({ example: '0818124891', description: '' })
  @IsString()
  phone: string;
}
