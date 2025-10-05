import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { CompanyStatus } from '../entities/company.entity';

export class CreateCompanyDto {
  @ApiProperty({ example: 'My Company', description: 'Company name' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'companyemail@example.com',
    description: 'Company email',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+234 08000000', description: 'Company phone' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'FCT Abuja', description: 'Company address' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Active', description: 'Company Status' })
  @IsString()
  status?: CompanyStatus;
}
