import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { Brand } from '../common/schemas/brand.schema';
import { ProjectionFields, QueryFilter, QueryOptions } from 'mongoose';
import { UsersService } from '../users/users.service';
import { IPagination } from '../common/interfaces/pagination.interface';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import { BrandsRepositoryService } from './repositories/brands-repository.service';

@Injectable()
export class BrandsService {
  private readonly logger = new Logger(BrandsService.name);

  constructor(
    private readonly brandRepository: BrandsRepositoryService,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, createBrandDto: CreateBrandDto): Promise<Brand> {
    this.logger.debug('Creating brand.');
    const user = await this.usersService.findOne({ _id: userId });
    if (!user) {
      this.logger.debug(`User not found for id: ${userId}.`);
      throw new NotFoundException(`User not found.`);
    }

    const brandExists = await this.brandRepository.exists({
      name: { $regex: createBrandDto.name, $options: 'i' },
    });
    if (brandExists) {
      this.logger.debug(
        `Brand already exists for name: ${createBrandDto.name}.`,
      );
      throw new ConflictException(`Brand already exists.`);
    }

    const brand = await this.brandRepository.create({
      name: createBrandDto.name,
    });
    this.logger.debug('Brand created.', 'Adding user to brand.');

    const updatedBrand = await this.brandRepository.findOneAndUpdate(
      { _id: brand._id },
      { $push: { users: user } },
      { returnDocument: 'after' },
    );
    if (!updatedBrand) {
      this.logger.error('Error adding user to brand.');
      this.logger.debug('Deleting brand.');
      await this.brandRepository.findOneAndDelete({ _id: brand._id });
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

    const brands = await this.brandRepository.find(queryFilter, projection, {
      ...options,
      skip: paginationDto.skip,
      limit: paginationDto.limit,
    });

    if (brands.totalItems === 1) {
      this.logger.debug(`${brands.totalItems} brand found.`);
    } else {
      this.logger.debug(`${brands.totalItems} brands found.`);
    }

    return brands;
  }

  async findOne(
    queryFilter: QueryFilter<Brand>,
    projection: ProjectionFields<Brand> = {},
    options: QueryOptions<Brand> = {},
  ): Promise<Brand> {
    this.logger.debug('Finding brand.');
    const brand = await this.brandRepository.findOne(
      queryFilter,
      projection,
      options,
    );
    if (!brand) {
      this.logger.debug(
        `Brand not found for query: ${JSON.stringify(queryFilter)}.`,
      );
      throw new NotFoundException(`Brand not found.`);
    }
    this.logger.debug('Brand found.');
    return brand;
  }

  async appendUser(brandId: string, userId: string): Promise<void> {
    this.logger.debug('Adding user to brand.');
    const updatedBrand = await this.brandRepository.findOneAndUpdate(
      { _id: brandId },
      { $push: { users: userId } },
      { returnDocument: 'after' },
    );
    if (!updatedBrand) {
      this.logger.error('Error adding user to brand.');
      throw new InternalServerErrorException(
        'Error linking current user to brand. Try again later.',
      );
    }
    this.logger.debug('User added to brand.');
  }
}
