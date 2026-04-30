import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from './abstract.schema';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { User } from './users.schema';
import { Product } from './product.schema';

export type SaleDocument = HydratedDocument<Sale>;

export class SaleProduct {
  product: Types.ObjectId | Product;
  quantity: number;
  unitPrice: number;
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Sale extends AbstractDocument {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: User.name,
  })
  user: Types.ObjectId | User;

  @Prop({
    type: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: Product.name,
        },
        quantity: Number,
        unitPrice: Number,
      },
    ],
    required: true,
    min: 1,
  })
  saleProducts: SaleProduct[];

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  total: number;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);
