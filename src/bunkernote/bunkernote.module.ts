import { forwardRef, Module } from '@nestjs/common';
import { BunkernoteService } from './bunkernote.service';
import { BunkernoteController } from './bunkernote.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Bunkernote, BunkernoteSchema } from './entities/bunkernote.entity';
import { UsersModule } from 'src/users/users.module';
import { User, UserSchema } from 'src/users/entities/user.entity';
 import { Company, CompanySchema } from 'src/company/entities/company.entity';
import { CompanyModule } from 'src/company/company.module';
import { MailjetService } from 'src/Email/mailjet';
import { Invoice, InvoiceSchema } from 'src/invoice/entities/invoice.entity';
import { InvoiceModule } from 'src/invoice/invoice.module';
import { Waybill, WaybillSchema } from 'src/waybill/entities/waybill.entity';
import { WaybillModule } from 'src/waybill/waybill.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bunkernote.name, schema: BunkernoteSchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => UsersModule),

    MongooseModule.forFeature([{ name: Waybill.name, schema: WaybillSchema }]),
    forwardRef(() => WaybillModule),
    MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
    forwardRef(() => CompanyModule),
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
    forwardRef(() => InvoiceModule),
  ],
  controllers: [BunkernoteController],
  providers: [BunkernoteService, MailjetService],
  exports: [BunkernoteService],
})
export class BunkernoteModule {}
