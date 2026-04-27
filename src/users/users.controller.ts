import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '../common/schemas/users.schema';
import { ParseMongoIdsPipe } from '../common/pipes/parse-mongo-ids.pipe';
import { IPagination } from '../common/interfaces/pagination.interface';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  async findAll(
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<IPagination<User>> {
    return await this.usersService.findAll({}, {}, {}, paginationQueryDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseMongoIdsPipe) id: string): Promise<User> {
    return await this.usersService.findOne({ _id: id });
  }
}
