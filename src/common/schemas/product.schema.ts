import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './users.schema';
import { Brand } from './brand.schema';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { AbstractDocument } from './abstract.schema';

export type ProductDocument = HydratedDocument<Product>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Product extends AbstractDocument {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: User.name,
  })
  user: Types.ObjectId | User;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: Brand.name,
  })
  brand: Types.ObjectId | Brand;

  @Prop({
    type: String,
    required: true,
    minLength: 3,
    maxLength: 20,
  })
  name: string;

  @Prop({
    type: Number,
    required: false,
    min: 0,
    default: 0,
  })
  cost: number;

  @Prop({
    type: Number,
    required: false,
    min: 0,
    default: 0,
  })
  gain: number;

  @Prop({
    type: Number,
    required: false,
    min: 0,
    default: 0,
  })
  price: number;

  @Prop({
    type: Number,
    required: false,
    min: 0,
    default: 0,
  })
  stock: number;

  @Prop({
    type: Boolean,
    required: false,
    default: true,
  })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
