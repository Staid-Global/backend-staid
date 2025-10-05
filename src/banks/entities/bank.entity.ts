import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Schema()
export class Bank {
  @Prop({ ref: 'Company' })
  bank_name: string;

  @Prop()
  account_number: string;

  @Prop()
  account_name: string;

  @Prop({ ref: 'User' })
  added_by: string;

  @Prop({ ref: 'User' })
  edited_by: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export type BankDocument = Bank & Document;
export const BankSchema = SchemaFactory.createForClass(Bank);

