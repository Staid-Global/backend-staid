import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InvoiceModule } from './invoice/invoice.module';
import { CompanyModule } from './company/company.module';
import { BanksModule } from './banks/banks.module';
import { QuotationModule } from './quotation/quotation.module';
import { WaybillModule } from './waybill/waybill.module';
import { BunkernoteModule } from './bunkernote/bunkernote.module';
import { MongooseModule } from '@nestjs/mongoose';
import { EmaildirectoryModule } from './emaildirectory/emaildirectory.module';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(String(process.env.MONGODB_URL)),

    AuthModule,
    UsersModule,
    CompanyModule,
    QuotationModule,
    InvoiceModule,
    WaybillModule,
    EmaildirectoryModule,
    BunkernoteModule,
    BanksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
