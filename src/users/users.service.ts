import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ProjectionFields, QueryFilter, QueryOptions } from 'mongoose';
import { User } from '../common/schemas/users.schema';
import { IPagination } from '../common/interfaces/pagination.interface';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';

@Injectable()
export class UsersService {
  private logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name)
    private UserModel: Model<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.debug('Creating user.');

    const userExists = await this.UserModel.exists({
      username: createUserDto.username,
    });

    if (userExists) {
      this.logger.debug(
        `User already exists for username: ${createUserDto.username}.`,
      );
      throw new ConflictException(`User already exists.`);
    }

    const user = await this.UserModel.create(createUserDto);
    this.logger.debug('User created.');
    return user;
  }

  async findAll(
    queryFilter: QueryFilter<User> = {},
    projection: ProjectionFields<User> = {},
    options: QueryOptions<User> = {},
    paginationDto: PaginationQueryDto,
  ): Promise<IPagination<User>> {
    this.logger.debug('Finding all users.');

    const [skip, limit] = [paginationDto.skip || 0, paginationDto.limit || 25];
    const users = await this.UserModel.find(queryFilter, projection, {
      skip,
      limit,
      ...options,
    });
    const itemsCount = users.length;

    if (itemsCount === 1) {
      this.logger.debug(`${itemsCount} user found.`);
    } else {
      this.logger.debug(`${itemsCount} users found.`);
    }

    this.logger.debug('Users found.');
    return {
      items: users,
      itemsCount,
      pagesCount: Math.ceil(users.length / limit),
      skip,
      limit,
    };
  }

  async findOne(
    queryFilter: QueryFilter<User>,
    projection: ProjectionFields<User> = {},
    options: QueryOptions<User> = {},
  ): Promise<User> {
    this.logger.debug('Finding user.');
    const user = await this.UserModel.findOne(queryFilter, projection, options);
    if (!user) {
      this.logger.debug(
        `User not found for query: ${JSON.stringify(queryFilter)}, projection: ${JSON.stringify(projection)}, options: ${JSON.stringify(options)}.`,
      );
      throw new NotFoundException(`User not found.`);
    }
    this.logger.debug('User found.');
    return user;
  }
}
