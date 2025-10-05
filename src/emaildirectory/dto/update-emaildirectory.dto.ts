import { PartialType } from '@nestjs/swagger';
import { CreateEmaildirectoryDto } from './create-emaildirectory.dto';

export class UpdateEmaildirectoryDto extends PartialType(CreateEmaildirectoryDto) {}
