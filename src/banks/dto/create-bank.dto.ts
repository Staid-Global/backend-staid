import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateBankDto {
  @ApiProperty({ example: 'Zenith', description: '' })
  @IsString()
  bank_name: string;

  @ApiProperty({ example: '000345', description: '' })
  @IsString()
  account_number: string;

  @ApiProperty({ example:'Johe Doe', description: '' })
  @IsString()
  account_name: string;
}
