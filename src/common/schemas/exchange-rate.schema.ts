import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from './abstract.schema';
import { HydratedDocument } from 'mongoose';
import { CurrenciesEnum } from '../enums/currencies.enum';

export type ExchangeRateDocument = HydratedDocument<ExchangeRate>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class ExchangeRate extends AbstractDocument {
  @Prop({
    type: String,
    required: true,
    enum: CurrenciesEnum,
  })
  currency: CurrenciesEnum;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  amount: number;
}

export const ExchangeRateSchema = SchemaFactory.createForClass(ExchangeRate);
