import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';

export enum BunkerStatus {
  DRAFT = 'Draft',
  APPROVED = 'Approved',
  COMPLETED = 'Completed',
}

@Schema()
export class Bunkernote {
  @Prop()
  bunker_id: number;

  @Prop()
  vessel_name: string;

  @Prop()
  seller: string;

  @Prop()
  port?: string;

  @Prop()
  delivery: string;

  @Prop({default: BunkerStatus.DRAFT})
  status: string;

  @Prop({ default: Date.now })
  dateOfCommencement: Date;

  @Prop()
  product: string;

  @Prop()
  quantity: number;

  @Prop()
  start_pumping: string;

  @Prop()
  finish_pumping: string;

  @Prop()
  density: number;

  @Prop()
  flashpoint: number;

  @Prop()
  sulphur: number;

  @Prop()
  disclaimer_note: string;

  @Prop({ ref: 'User' })
  added_by: string;

  @Prop({ ref: 'User' })
  edited_by: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export type BunkernoteDocument = Bunkernote & Document;
export type BunkernoteModel = Model<BunkernoteDocument>;

export const BunkernoteSchema = SchemaFactory.createForClass(Bunkernote);

// ✅ Pre-save hook with proper typing
BunkernoteSchema.pre<BunkernoteDocument>('save', async function (next) {
  if (this.isNew) {
    // Cast constructor to BunkernoteModel so TS knows findOne exists
    const Model = this.constructor as BunkernoteModel;

    const lastBunkernote = await Model.findOne(
      {},
      {},
      { sort: { bunker_id: -1 } },
    ).exec();

    this.bunker_id = lastBunkernote ? lastBunkernote.bunker_id + 1 : 1;
  }
  next();
});
