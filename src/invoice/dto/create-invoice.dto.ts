import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { invoiceItemObj } from '../entities/invoice.entity';
import { Type } from 'class-transformer';

export class CreateInvoiceDto {
  @ApiProperty({
    example: '689f3dd079974d2293cb94f4',
    description: 'Selected Company_id',
  })
  @IsString()
  company: string;

  @ApiProperty({ example: 'rail-road-track', description: '' })
  @IsString()
  category?: string;

  @ApiProperty({
    type: () => [invoiceItemObj],
    example: [
      {
        description: 'A.G.O(Automative Gas Oil)',
        quantity: 1,
        rate: 500000,
        total: 0,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => invoiceItemObj)
  @ArrayNotEmpty({
    message: 'At least one item should be added',
  })
  @IsString()
  items: invoiceItemObj[];

  @ApiProperty({ example: 'Debtor', description: 'Status' })
  @IsString()
  status: string;

  @ApiProperty({ example: 10000, description: '' })
  @IsNumber()
  handling_charge: number;

  @ApiProperty({ example: 0.075, description: '' })
  @IsNumber()
  vat: number;

  @ApiProperty({ example: 1003, description: '', required: true })
  @IsNumber()
  lpo: number;

  @ApiProperty({ example: '2024-06-01T00:00:00.000Z', description: '' })
  @IsString()
  date: Date;
}
