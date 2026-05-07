import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from './abstract.schema';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { User } from './users.schema';
import { Product } from './product.schema';
import { ExchangeRate } from './exchange-rate.schema';

export type SaleProductDocument = HydratedDocument<SaleProduct>;
@Schema({ _id: false, versionKey: false })
export class SaleProduct {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: Product.name,
  })
  product: Types.ObjectId | Product;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  quantity: number;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  unitPrice: number;
}

export const SaleProductSchema = SchemaFactory.createForClass(SaleProduct);

export type SaleDocument = HydratedDocument<Sale>;

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
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: ExchangeRate.name,
  })
  exchangeRate: Types.ObjectId | ExchangeRate;

  @Prop({
    type: [SaleProductSchema],
    required: true,
    validate: {
      validator: (products: SaleProduct[]) => products.length > 0,
      message: 'saleProducts must contain at least one item',
    },
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
