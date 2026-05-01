import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from '../common/schemas/product.schema';
import {
  ProjectionFields,
  QueryFilter,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { UsersService } from '../users/users.service';
import { BrandsService } from '../brands/brands.service';
import { IPagination } from '../common/interfaces/pagination.interface';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import { ProductRepositoryService } from './repositories/product-repository.service';
import { ProductStockOperationsEnum } from '../common/enums/product-stock-operations.enum';
import { ProductStockOperationDto } from './dto/product-stock-operation.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly productRepository: ProductRepositoryService,

    private readonly usersService: UsersService,
    private readonly brandsService: BrandsService,
  ) {}

  async create(
    userId: string,
    brandId: string,
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    this.logger.debug('Creating product.');

    this.validateCreationData(createProductDto);

    const user = await this.usersService.findOne({ _id: userId });
    const brand = await this.brandsService
      .findOne({
        _id: brandId,
        users: {
          $elemMatch: { $eq: userId },
        },
      })
      .catch(async () => {
        this.logger.debug('Current user not linked to brand. Linking now.');
        await this.brandsService.appendUser(brandId, userId);
        return (await this.brandsService.findOne({ _id: brandId }))._id;
      });

    const data: Partial<Product> = {
      ...createProductDto,
      ...this.calculateGainOrPrice(createProductDto),
      user,
      brand,
    };

    const product = await this.productRepository.create(data);

    if (!product) {
      this.logger.error('Error creating product.');
      throw new InternalServerErrorException(
        'Error creating product. Try again later.',
      );
    }

    this.logger.debug('Product created.');
    return product;
  }

  async find(
    queryFilter: QueryFilter<Product>,
    projection: ProjectionFields<Product> = {},
    options: QueryOptions<Product> = {},
    paginationDto: PaginationQueryDto,
  ): Promise<IPagination<Product>> {
    this.logger.debug('Finding all products.');

    const products = await this.productRepository.find(
      queryFilter,
      projection,
      {
        skip: paginationDto.skip,
        limit: paginationDto.limit,
        ...options,
      },
    );

    if (products.totalItems === 1) {
      this.logger.debug(`${products.totalItems} product found.`);
    } else {
      this.logger.debug(`${products.totalItems} products found.`);
    }

    return products;
  }

  async findOne(
    queryFilter: QueryFilter<Product>,
    projection: ProjectionFields<Product> = {},
    options: QueryOptions<Product> = {},
  ): Promise<Product> {
    this.logger.debug('Finding product.');

    const product = await this.productRepository.findOne(
      queryFilter,
      projection,
      options,
    );
    if (!product) {
      this.logger.debug(
        `Product not found for query: ${JSON.stringify(queryFilter)}.`,
      );
      throw new NotFoundException(`Product not found.`);
    }
    this.logger.debug('Product found.');
    return product;
  }

  async count(queryFilter: QueryFilter<Product>): Promise<number> {
    this.logger.debug('Counting products.');
    const count = await this.productRepository.count(queryFilter);
    this.logger.debug('Products counted.');
    return count;
  }

  async findOneAndUpdate(
    queryFilter: QueryFilter<Product>,
    update: UpdateQuery<Product>,
    options: QueryOptions<Product> = {},
  ): Promise<Product> {
    this.logger.debug('Updating product.');
    const product = await this.productRepository.findOneAndUpdate(
      queryFilter,
      update,
      options,
    );
    if (!product) {
      this.logger.debug(
        `Product not found for query: ${JSON.stringify(queryFilter)}.`,
      );
      throw new NotFoundException(`Product not found.`);
    }
    this.logger.debug('Product updated.');
    return product;
  }

  async stockOperation(
    userId: string,
    productId: string,
    operationDto: ProductStockOperationDto,
  ): Promise<Product> {
    this.logger.debug(
      `Performing stock operation: ${operationDto.operation} for product ID: ${productId}.`,
    );

    const update = { $inc: { stock: 0 } };
    if (operationDto.operation === ProductStockOperationsEnum.INCREMENT) {
      update.$inc.stock = operationDto.quantity;
    } else {
      update.$inc.stock = -operationDto.quantity;
    }

    const product = await this.productRepository.findOneAndUpdate(
      { user: userId, _id: productId },
      update,
    );

    if (!product) {
      this.logger.debug(`Product not found for ID: ${productId}.`);
      throw new NotFoundException(`Product not found.`);
    }

    this.logger.debug(`Updated product stock: ${product.stock}.`);
    return product;
  }

  private validateCreationData(dto: CreateProductDto): void {
    if (dto.gain && dto.price) {
      throw new ConflictException(
        'Gain and price cannot be set at the same time.',
      );
    }

    if (!dto.gain && !dto.price) {
      throw new ConflictException('Gain or price must be set.');
    }

    if (dto.price !== undefined) {
      const gain = (dto.price / dto.cost - 1) * 100;

      if (gain > 30) {
        throw new ConflictException('Gain must not be greater than 30%.');
      }

      if (dto.price < dto.cost) {
        throw new ConflictException('Price must be greater than cost.');
      }
    }
  }

  private calculateGainOrPrice(dto: CreateProductDto): {
    gain: number;
    price: number;
  } {
    // Calculate gain and price
    // 1. If gain is set, price must be calculated
    // 2. If price is set, gain must be calculated\

    // We assume that cost is always set based on the validations

    if (dto.gain !== undefined && dto.cost > 0) {
      const price = dto.cost * (1 + dto.gain / 100);

      return {
        gain: Number(dto.gain.toFixed(2)),
        price: Number(price.toFixed(2)),
      };
    } else if (dto.price !== undefined && dto.cost > 0) {
      const gain = (dto.price / dto.cost - 1) * 100; // Assume cost is set if price is

      return {
        gain: Number(gain.toFixed(2)),
        price: Number(dto.price.toFixed(2)), // Assume price is set if gain is not
      };
    } else {
      return {
        gain: 0,
        price: 0,
      };
    }
  }
}
