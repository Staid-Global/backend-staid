import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailjetService } from 'src/Email/mailjet';
import { Invoice, InvoiceSchema } from 'src/invoice/entities/invoice.entity';
import { InvoiceModule } from 'src/invoice/invoice.module';
import { Bunkernote, BunkernoteSchema } from 'src/bunkernote/entities/bunkernote.entity';
import { BunkernoteModule } from 'src/bunkernote/bunkernote.module';
import { Quotation, QuotationSchema } from 'src/quotation/entities/quotation.entity';
import { QuotationModule } from 'src/quotation/quotation.module';
import { Waybill, WaybillSchema } from 'src/waybill/entities/waybill.entity';
import { WaybillModule } from 'src/waybill/waybill.module';
import { Company, CompanySchema } from 'src/company/entities/company.entity';
import { CompanyModule } from 'src/company/company.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => UsersModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION') },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
    forwardRef(() => InvoiceModule),
    MongooseModule.forFeature([{ name: Bunkernote.name, schema: BunkernoteSchema }]),
    forwardRef(() => BunkernoteModule),
    MongooseModule.forFeature([{ name: Quotation.name, schema: QuotationSchema }]),
    forwardRef(() => QuotationModule),
    MongooseModule.forFeature([{ name: Waybill.name, schema: WaybillSchema }]),
    forwardRef(() => WaybillModule),
    MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
    forwardRef(() => CompanyModule),
  ],
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy, ConfigService, MailjetService],
  exports: [AuthService],
})
export class AuthModule {}
