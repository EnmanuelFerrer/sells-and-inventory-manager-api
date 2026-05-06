import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { User } from './users.schema';
import { AbstractDocument } from './abstract.schema';

export type BrandDocument = HydratedDocument<Brand>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Brand extends AbstractDocument {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
  })
  user: Types.ObjectId | User;

  @Prop({
    type: String,
    required: true,
    unique: true,
    minLength: 3,
    maxLength: 20,
  })
  name: string;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);
