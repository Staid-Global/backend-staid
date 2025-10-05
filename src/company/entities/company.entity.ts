import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum CompanyStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Prospect = 'Prospect',
}

@Schema()
export class Company {
  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop()
  address: string;

  @Prop({ ref: 'User' })
  added_by: string;

  @Prop({ ref: 'User' })
  edited_by: string;

  @Prop({ default: CompanyStatus.Active })
  status: CompanyStatus;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export type CompanyDocument = Company & Document;
export const CompanySchema = SchemaFactory.createForClass(Company);
