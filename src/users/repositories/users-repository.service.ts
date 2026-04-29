import { Model } from 'mongoose';
import { RepositoryService } from '../../common/repository/repository.service';
import { User, UserDocument } from '../../common/schemas/users.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UsersRepositoryService extends RepositoryService<UserDocument> {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super(userModel);
  }
}
