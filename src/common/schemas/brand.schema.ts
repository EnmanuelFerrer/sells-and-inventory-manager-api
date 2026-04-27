import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from './users.schema';

export type BrandDocument = HydratedDocument<Brand>;

@Schema()
export class Brand {
  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: User.name,
      },
    ],
  })
  users: User[];

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
