import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Product } from './product.schema';
import { User } from './users.schema';
import { ExchangeRate } from './exchange-rate.schema';
import { AbstractDocument } from './abstract.schema';

export type OrderProductDocument = HydratedDocument<OrderProduct>;

@Schema({
  _id: false,
  versionKey: false,
})
export class OrderProduct {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: Product.name,
  })
  product: Types.ObjectId | Product;

  @Prop({
    type: Number,
    required: true,
  })
  unitPrice: number;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  quantity: number;
}

export const OrderProductSchema = SchemaFactory.createForClass(OrderProduct);

export type OrderDocument = HydratedDocument<Order>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Order extends AbstractDocument {
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
    type: [OrderProduct],
    required: false,
    default: [],
  })
  products: OrderProduct[] | [];

  @Prop({
    type: Number,
    required: false,
    min: 0,
    default: 0,
  })
  total: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
