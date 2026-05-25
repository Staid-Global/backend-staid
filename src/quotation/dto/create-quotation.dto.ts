import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsString,
  ValidateNested,
} from 'class-validator';
import { itemObj } from '../entities/quotation.entity';
import { Type } from 'class-transformer';

export class CreateQuotationDto {
  @ApiProperty({
    example: '689f3dd079974d2293cb94f4',
    description: 'Selected Company_id',
  })
  @IsString()
  company: string;

  @ApiProperty({
    example: 'Quote for supply of A.G.O',
    description: '',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    example: 'We hereby quote for 66,000ltrs of A.G.O at the rate',
    description: '',
  })
  @IsString()
  body: string;

  @ApiProperty({ example: 'rail-road-track', description: '' })
  @IsString()
  category?: string;

  @ApiProperty({ example: 10000, description: '' })
  @IsString()
  handling_charge: number;

  @ApiProperty({ example: 'Optional Note here', description: '' })
  @IsString()
  notes?: string;

  @ApiProperty({
    type: () => [itemObj],
    example: [
      {
        description: 'A.G.O(Automative Gas Oil)',
        quantity: 1,
        unit: '66000ltrs',
        rate: 500000,
        total: 0,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => itemObj)
  @ArrayNotEmpty({
    message: 'At least one item should be added',
  })
  @IsString()
  items: itemObj[];

  @ApiProperty({ example: 'Draft', description: 'Status' })
  @IsString()
  status?: string;

  @ApiProperty({ example: '2024-06-01T00:00:00.000Z', description: '' })
  @IsString()
  date: Date;
}
