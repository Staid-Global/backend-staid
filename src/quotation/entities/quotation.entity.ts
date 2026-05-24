import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';

export enum QuotationStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  APPROVED = 'Approved',
  DECLINED = 'Declined',
}

export class itemObj {
  @Prop()
  description: string;

  @Prop()
  quantity: number;

  @Prop()
  unit: string;

  @Prop()
  rate: number;

  @Prop()
  total: number;
}

@Schema()
export class Quotation {
  @Prop({ default: 0 })
  quotation_id: number;

  @Prop()
  hashed_id: string;

  @Prop({ ref: 'Company' })
  company: string;

  @Prop()
  subject: string;

  @Prop()
  body: string;

  @Prop()
  notes?: string;

  @Prop({ default: QuotationStatus.DRAFT })
  status?: string;

  @Prop()
  category: string;

  @Prop()
  handling_charge: number;

  @Prop()
  items: itemObj[];

  @Prop({ ref: 'User' })
  added_by: string;

  @Prop({ ref: 'User' })
  edited_by: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: Date.now })
  date: Date;
}

export type QuotationDocument = Quotation & Document;
export type QuotationModel = Model<QuotationDocument>;

export const QuotationSchema = SchemaFactory.createForClass(Quotation);

// ✅ Pre-save hook with proper typing
QuotationSchema.pre<QuotationDocument>('save', async function (next) {
  if (this.isNew) {
    // Cast constructor to QuotationModel so TS knows findOne exists
    const Model = this.constructor as QuotationModel;

    const lastQuotation = await Model.findOne(
      {},
      {},
      { sort: { quotation_id: -1 } },
    ).exec();

    this.quotation_id = lastQuotation ? lastQuotation.quotation_id + 1 : 1;
  }
  next();
});
