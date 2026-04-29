import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { RolesEnum } from '../enums/roles.enum';
import { AbstractDocument } from './abstract.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User extends AbstractDocument {
  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    toLocaleLowerCase: true,
    minLength: 3,
    maxLength: 20,
  })
  username: string;

  @Prop({
    type: String,
    required: true,
  })
  password: string;

  @Prop({
    type: String,
    required: false,
    enum: RolesEnum,
    default: RolesEnum.USER,
  })
  rol: RolesEnum;

  @Prop({
    type: Boolean,
    required: false,
    default: true,
  })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
