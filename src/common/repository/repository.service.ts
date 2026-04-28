import {
  Document,
  Model,
  ProjectionFields,
  QueryFilter,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { IPagination } from '../interfaces/pagination.interface';
import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../dtos/pagination-query.dto';

@Injectable()
export class RepositoryService<TDocument extends Document> {
  constructor(private readonly model: Model<TDocument>) {}

  async create(data: Partial<TDocument>): Promise<TDocument> {
    const newDoc = new this.model(data);
    return await newDoc.save();
  }

  async find(
    queryFilter: QueryFilter<TDocument>,
    projection?: ProjectionFields<TDocument>,
    options?: QueryOptions<TDocument>,
    pagination?: PaginationQueryDto,
  ): Promise<IPagination<TDocument>> {
    const [skip, limit] = [pagination?.skip || 0, pagination?.limit || 25];
    const items = await this.model.find(queryFilter, projection, {
      skip: pagination?.skip || 0,
      limit: pagination?.limit || 25,
      ...options,
    });
    const count = await this.model.countDocuments(queryFilter);
    return {
      items,
      skip: skip,
      limit: limit,
      totalItems: count,
      totalPages: Math.ceil(items.length / limit),
    };
  }

  async findOne(
    queryFilter: QueryFilter<TDocument>,
    projection?: ProjectionFields<TDocument>,
    options?: QueryOptions<TDocument>,
  ): Promise<TDocument | null> {
    const item = await this.model.findOne(queryFilter, projection, {
      lean: true,
      ...options,
    });
    return item;
  }

  async findOneAndUpdate(
    queryFilter: QueryFilter<TDocument>,
    update: UpdateQuery<TDocument>,
    options?: QueryOptions<TDocument>,
  ): Promise<TDocument | null> {
    const document = await this.model.findOneAndUpdate(queryFilter, update, {
      ...options,
      lean: true,
      returnDocument: 'after',
    });
    return document;
  }

  async findOneAndDelete(
    queryFilter: QueryFilter<TDocument>,
    options?: QueryOptions<TDocument>,
  ): Promise<TDocument | null> {
    const document = await this.model.findOneAndDelete(queryFilter, options);
    return document;
  }

  async exists(queryFilter: QueryFilter<TDocument>): Promise<boolean> {
    const exists = await this.model.exists(queryFilter);
    if (exists) return true;
    return false;
  }

  async count(queryFilter: QueryFilter<TDocument>): Promise<number> {
    const count = await this.model.countDocuments(queryFilter);
    return count;
  }
}
