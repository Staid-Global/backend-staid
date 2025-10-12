import { forwardRef, Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Invoice, InvoiceSchema } from './entities/invoice.entity';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import { Company, CompanySchema } from 'src/company/entities/company.entity';
import { CompanyModule } from 'src/company/company.module';
import { MailjetService } from 'src/Email/mailjet';
import { Bunkernote, BunkernoteSchema } from 'src/bunkernote/entities/bunkernote.entity';
import { BunkernoteModule } from 'src/bunkernote/bunkernote.module';
import { Waybill, WaybillSchema } from 'src/waybill/entities/waybill.entity';
import { WaybillModule } from 'src/waybill/waybill.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
    forwardRef(() => CompanyModule),
    MongooseModule.forFeature([{ name: Bunkernote.name, schema: BunkernoteSchema }]),
    forwardRef(() => BunkernoteModule),
    MongooseModule.forFeature([{ name: Waybill.name, schema: WaybillSchema }]),
    forwardRef(() => WaybillModule),
  ],

  controllers: [InvoiceController],
  providers: [InvoiceService, MailjetService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
