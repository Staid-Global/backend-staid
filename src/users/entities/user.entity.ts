import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AppRole {
  ADMIN = 'ADMIN',
  VIEWER = 'VIEWER',
}

@Schema()
export class User {
  @Prop()
  fullname: string;

  @Prop()
  password: string;

  @Prop() 
  email: string;

  @Prop() 
  picture: string;

  @Prop({default: 'active'}) 
  status: string;

  @Prop({ default: AppRole.ADMIN })
  role: AppRole;

  @Prop({default: Date.now}) 
  createdAt: Date;

  @Prop({default: Date.now}) 
  updatedAt: Date;

  @Prop({default: Date.now}) 
  last_Login: Date;

}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
