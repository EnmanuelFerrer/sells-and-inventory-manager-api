import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from './abstract.schema';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { User } from './users.schema';
import { Product } from './product.schema';
import { Order } from './order.schema';
import { SaleStatusesEnum } from '../enums/sale-statuses.enum';

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
    ref: Order.name,
  })
  order: Types.ObjectId | Order;

  @Prop({
    type: String,
    enum: SaleStatusesEnum,
    required: true,
  })
  status: SaleStatusesEnum;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);
