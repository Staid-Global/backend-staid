import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';

export enum CompanyStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Prospect = 'Prospect',
}

@Schema()
export class Emaildirectory {
  @Prop()
  name: string;

  @Prop()
  company_email: string;

  @Prop({ ref: 'Company' })
  company: string;

  @Prop()
  officeNumber: string;

  @Prop()
  phone: string;

  @Prop({ ref: 'User' })
  added_by: string;

  @Prop({ ref: 'User' })
  edited_by: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export type EmaildirectoryDocument = Emaildirectory & Document;
export type EmaildirectoryModel = Model<EmaildirectoryDocument>;

export const EmaildirectorySchema =
  SchemaFactory.createForClass(Emaildirectory);
