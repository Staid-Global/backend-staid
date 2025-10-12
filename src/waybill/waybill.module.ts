import { forwardRef, Module } from '@nestjs/common';
import { WaybillService } from './waybill.service';
import { WaybillController } from './waybill.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { Waybill, WaybillSchema } from './entities/waybill.entity';
import { Company, CompanySchema } from 'src/company/entities/company.entity';
import { CompanyModule } from 'src/company/company.module';
import { MailjetService } from 'src/Email/mailjet';
import { Bunkernote, BunkernoteSchema } from 'src/bunkernote/entities/bunkernote.entity';
import { BunkernoteModule } from 'src/bunkernote/bunkernote.module';
import { Invoice, InvoiceSchema } from 'src/invoice/entities/invoice.entity';
import { InvoiceModule } from 'src/invoice/invoice.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Waybill.name, schema: WaybillSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema}]),
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
    forwardRef(() => CompanyModule),
    MongooseModule.forFeature([{ name: Bunkernote.name, schema: BunkernoteSchema }]),
    forwardRef(() => BunkernoteModule),
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
    forwardRef(() => InvoiceModule),
  ],
  controllers: [WaybillController],
  providers: [WaybillService, MailjetService],
  exports: [WaybillService],
})
export class WaybillModule {}
