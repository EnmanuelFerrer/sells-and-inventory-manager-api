import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ProjectionFields, QueryFilter, QueryOptions } from 'mongoose';
import { User, UserDocument } from '../common/schemas/users.schema';
import { IPagination } from '../common/interfaces/pagination.interface';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import { UsersRepositoryService } from './repositories/users-repository.service';

@Injectable()
export class UsersService {
  private logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepositoryService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.debug('Creating user.');

    const userExists = await this.usersRepository.exists({
      username: createUserDto.username,
    });

    if (userExists) {
      this.logger.debug(
        `User already exists for username: ${createUserDto.username}.`,
      );
      throw new ConflictException(`User already exists.`);
    }

    const user = await this.usersRepository.create(createUserDto);

    if (!user) {
      this.logger.error('Error creating user.');
      throw new NotFoundException(`User not found.`);
    }

    this.logger.debug('User created.');
    return user;
  }

  async findAll(
    queryFilter: QueryFilter<User> = {},
    projection: ProjectionFields<User> = {},
    options: QueryOptions<User> = {},
    paginationDto: PaginationQueryDto,
  ): Promise<IPagination<UserDocument>> {
    this.logger.debug('Finding all users.');
    const users = await this.usersRepository.find(queryFilter, projection, {
      ...options,
      skip: paginationDto.skip,
      limit: paginationDto.limit,
    });

    if (users.totalItems === 1) {
      this.logger.debug(`${users.totalItems} user found.`);
    } else {
      this.logger.debug(`${users.totalItems} users found.`);
    }

    this.logger.debug('Users found.');
    return users;
  }

  async findOne(
    queryFilter: QueryFilter<User>,
    projection: ProjectionFields<User> = {},
    options: QueryOptions<User> = {},
  ): Promise<UserDocument> {
    this.logger.debug('Finding user.');
    const user = await this.usersRepository.findOne(
      queryFilter,
      projection,
      options,
    );
    if (!user) {
      this.logger.debug(
        `User not found for query: ${JSON.stringify(queryFilter)}, projection: ${JSON.stringify(projection)}, options: ${JSON.stringify(options)}.`,
      );
      throw new NotFoundException(`User not found.`);
    }
    this.logger.debug('User found.');
    return user;
  }

  async exists(queryFilter: QueryFilter<User>): Promise<void> {
    this.logger.debug('Checking if user exists.');
    const userExists = await this.usersRepository.exists(queryFilter);
    if (!userExists) throw new NotFoundException(`User not found.`);
    this.logger.debug('User exists.');
  }
}
