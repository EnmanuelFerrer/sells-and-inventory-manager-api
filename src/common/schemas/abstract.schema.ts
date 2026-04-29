import { Prop } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';

export abstract class AbstractDocument {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    default: () => new Types.ObjectId(),
  })
  _id: mongoose.Types.ObjectId;
}
