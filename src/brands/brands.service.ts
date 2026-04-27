import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Brand } from '../common/schemas/brand.schema';
import { Model, ProjectionFields, QueryFilter, QueryOptions } from 'mongoose';
import { UsersService } from '../users/users.service';
import { IPagination } from '../common/interfaces/pagination.interface';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';

@Injectable()
export class BrandsService {
  private readonly logger = new Logger(BrandsService.name);

  constructor(
    @InjectModel(Brand.name) private brandModel: Model<Brand>,

    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, createBrandDto: CreateBrandDto): Promise<Brand> {
    this.logger.debug('Creating brand.');
    const user = await this.usersService.findOne({ _id: userId });
    if (!user) {
      this.logger.debug(`User not found for id: ${userId}.`);
      throw new NotFoundException(`User not found.`);
    }

    const brandExists = await this.brandModel.exists({
      name: { $regex: createBrandDto.name, $options: 'i' },
    });
    if (brandExists) {
      this.logger.debug(
        `Brand already exists for name: ${createBrandDto.name}.`,
      );
      throw new ConflictException(`Brand already exists.`);
    }

    const brand = await this.brandModel.create({
      name: createBrandDto.name,
    });
    this.logger.debug('Brand created.', 'Adding user to brand.');

    const updatedBrand = await this.brandModel.findOneAndUpdate(
      { _id: brand._id },
      { $push: { users: user } },
      { returnDocument: 'after' },
    );
    if (!updatedBrand) {
      this.logger.error('Error adding user to brand.');
      this.logger.debug('Deleting brand.');
      await this.brandModel.findOneAndDelete({ _id: brand._id });
      this.logger.debug('Brand deleted.');
      throw new InternalServerErrorException(
        'Error linking current user to brand. Try again later.',
      );
    }

    this.logger.debug('User added to brand.');
    return updatedBrand;
  }

  async findAll(
    queryFilter: QueryFilter<Brand>,
    projection: ProjectionFields<Brand> = {},
    options: QueryOptions<Brand> = {},
    paginationDto: PaginationQueryDto,
  ): Promise<IPagination<Brand>> {
    this.logger.debug('Finding all brands.');

    const [skip, limit] = [paginationDto.skip || 0, paginationDto.limit || 25];
    const brands = await this.brandModel.find(queryFilter, projection, {
      skip,
      limit,
      ...options,
    });
    const itemsCount = brands.length;

    if (itemsCount === 1) {
      this.logger.debug(`${itemsCount} brand found.`);
    } else {
      this.logger.debug(`${itemsCount} brands found.`);
    }

    return {
      items: brands,
      itemsCount,
      pagesCount: Math.ceil(brands.length / limit),
      skip,
      limit,
    };
  }
}
