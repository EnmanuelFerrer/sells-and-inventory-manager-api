import { Model } from 'mongoose';
import { RepositoryService } from '../../common/repository/repository.service';
import { User, UserDocument } from '../../common/schemas/users.schema';
import { getModelToken, InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersRepositoryService extends RepositoryService<UserDocument> {
  constructor(
    @InjectModel(getModelToken(User.name))
    private readonly userModel: Model<UserDocument>,
  ) {
    super(userModel);
  }
}
