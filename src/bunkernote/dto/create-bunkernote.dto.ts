import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateBunkernoteDto {
  @ApiProperty({ example: 'vassel name', description: '' })
  @IsString()
  vessel_name: string;

  @ApiProperty({ example: 'Port', description: '' })
  @IsString()
  port: string;

  @ApiProperty({
    example: 'seller name',
    description: '',
  })
  @IsString()
  seller: string;

  @ApiProperty({ example: 'Draft', description: 'Status' })
  @IsString()
  status: string;

  @ApiProperty({ example: 'delivery address', description: '' })
  @IsString()
  delivery: string;

  @ApiProperty({ example: '2025-08-23T17:31:21', description: '' })
  @IsString()
  dateOfCommencement: Date;

  @ApiProperty({ example: 'Product', description: '' })
  @IsString()
  product: string;

  @ApiProperty({ example: 3, description: '' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: '12:00', description: '' })
  @IsString()
  start_pumping: string;

  @ApiProperty({ example: '14:00', description: '' })
  @IsString()
  finish_pumping: string;

  @ApiProperty({ example: 4, description: '' })
  @IsNumber()
  density: number;

  @ApiProperty({ example: 5, description: '' })
  @IsNumber()
  flashpoint: number;

  @ApiProperty({ example: 3, description: '' })
  @IsNumber()
  sulphur: number;

  @ApiProperty({ example: 'Disclaimer note', description: '' })
  @IsString()
  disclaimer_note: string;
}
