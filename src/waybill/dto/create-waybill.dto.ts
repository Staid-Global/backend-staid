import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WayObj } from '../entities/waybill.entity';

export class CreateWaybillDto {
  @ApiProperty({
    example: '689f3dd079974d2293cb94f4',
    description: 'Selected Company_id',
  })
  @IsString()
  company: string;

  @ApiProperty({
    type: () => [WayObj],
    example: [
      {
        description: 'A.G.O(Automative Gas Oil)',
        // unit: '66000ltrs',
        // total: 0,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WayObj)
  @ArrayNotEmpty({
    message: 'At least one item should be added',
  })
  @IsString()
  items: WayObj[];

  @ApiProperty({ example: 'Draft', description: 'Status' })
  @IsString()
  status?: string;

  @ApiProperty({ example: 'rail-Road Track', description: '' })
  @IsString()
  category?: string;

  @ApiProperty({ example: 1003, description: '', required: true })
  @IsNumber()
  lpo: number;

  @ApiProperty({ example: '2024-06-01T00:00:00.000Z', description: '' })
  @IsString()
  date: Date;
}
