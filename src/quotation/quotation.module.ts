import { forwardRef, Module } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { QuotationController } from './quotation.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Quotation, QuotationSchema } from './entities/quotation.entity';
import { Company, CompanySchema } from 'src/company/entities/company.entity';
import { CompanyModule } from 'src/company/company.module';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import { MailjetService } from 'src/Email/mailjet';
import { Invoice, InvoiceSchema } from 'src/invoice/entities/invoice.entity';
import { InvoiceModule } from 'src/invoice/invoice.module';
import { Bunkernote, BunkernoteSchema } from 'src/bunkernote/entities/bunkernote.entity';
import { BunkernoteModule } from 'src/bunkernote/bunkernote.module';
import { Waybill, WaybillSchema } from 'src/waybill/entities/waybill.entity';
import { WaybillModule } from 'src/waybill/waybill.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Quotation.name, schema: QuotationSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
    forwardRef(() => InvoiceModule),
    MongooseModule.forFeature([{ name: Bunkernote.name, schema: BunkernoteSchema }]),
    forwardRef(() => BunkernoteModule),
    MongooseModule.forFeature([{ name: Waybill.name, schema: WaybillSchema }]),
    forwardRef(() => WaybillModule),
    MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
    forwardRef(() => CompanyModule),
  ],

  controllers: [QuotationController],
  providers: [QuotationService, MailjetService],
  exports: [QuotationService],
})
export class QuotationModule {}
