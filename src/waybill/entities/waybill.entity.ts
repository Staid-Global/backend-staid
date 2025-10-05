import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';

export enum WayStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  RECEIVED = 'Recieved',
  RETURNED = 'returned',
}

export class WayObj {
  @Prop()
  description: string;

  // @Prop()
  // unit: string;

  // @Prop()
  // total: number;
}

@Schema()
export class Waybill {
  @Prop({ default: 0 })
  lpo: number;

  @Prop({ default: 0 })
  way_id: number;

  @Prop()
  hashed_id: string;

  @Prop({ ref: 'Company' })
  company: string;

  @Prop({ default: WayStatus.DRAFT })
  status?: string;

  @Prop()
  items: WayObj[];

  @Prop()
  category: string;

  @Prop({ ref: 'User' })
  added_by: string;

  @Prop({ ref: 'User' })
  edited_by: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export type WaybillDocument = Waybill & Document;
export type WaybillModel = Model<WaybillDocument>;

export const WaybillSchema = SchemaFactory.createForClass(Waybill);

// ✅ Pre-save hook with proper typing
WaybillSchema.pre<WaybillDocument>('save', async function (next) {
  if (this.isNew) {
    // Cast constructor to WaybillModel so TS knows findOne exists
    const Model = this.constructor as WaybillModel;

    const lastWaybill = await Model.findOne(
      {},
      {},
      { sort: { way_id: -1 } },
    ).exec();

    this.way_id = lastWaybill ? lastWaybill.way_id + 1 : 1;
    this.lpo = lastWaybill ? lastWaybill.lpo + 1 : 1001;
  }
  next();
});
