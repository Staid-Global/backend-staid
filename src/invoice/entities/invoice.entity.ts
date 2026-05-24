import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';

export class invoiceItemObj {
  @Prop()
  description: string;

  @Prop()
  quantity: number;

  @Prop()
  rate: number;

  @Prop()
  total: number;
}

export enum InvoiceStatus {
  PAID = 'Paid',
  DEBTOR = 'Debtor',
}

@Schema()
export class Invoice {
  @Prop({ default: 1000 })
  invoice_id: number;

  @Prop()
  hashed_id: string;

  @Prop({})
  lpo: number;

  @Prop({ ref: 'Company' })
  company: string;

  @Prop({ default: InvoiceStatus.DEBTOR })
  status?: string;

  @Prop()
  category: string;

  @Prop()
  handling_charge: number;

  @Prop()
  vat: number;

  @Prop()
  items: invoiceItemObj[];

  @Prop({ ref: 'User' })
  added_by: string;

  @Prop({ ref: 'User' })
  edited_by: string;

  @Prop({ default: Date.now })
  date: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export type InvoiceDocument = Invoice & Document;
export type invoiceModel = Model<InvoiceDocument>;

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

// ✅ Pre-save hook with proper typing
InvoiceSchema.pre<InvoiceDocument>('save', async function (next) {
  if (this.isNew) {
    // Cast constructor to invoiceModel so TS knows findOne exists
    const Model = this.constructor as invoiceModel;

    const lastInvoice = await Model.findOne(
      {},
      {},
      { sort: { invoice_id: -1 } },
    ).exec();

    this.invoice_id = lastInvoice ? lastInvoice.invoice_id + 1 : 1;
    // this.lpo = lastInvoice ? lastInvoice.lpo + 1 : 1001;
  }
  next();
});
