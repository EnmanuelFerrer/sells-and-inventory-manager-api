import { Test, TestingModule } from '@nestjs/testing';
import { BrandsService } from './brands.service';
import { BrandsRepositoryService } from './repositories/brands-repository.service';
import { UsersService } from '../users/users.service';
import { Brand } from '../common/schemas/brand.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import { IPagination } from '../common/interfaces/pagination.interface';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { User } from '../common/schemas/users.schema';

describe('BrandsService', () => {
  let service: BrandsService;
  let mockBrandRepository: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    findOneAndDelete: jest.Mock;
    exists: jest.Mock;
  };
  let mockUsersService: {
    findOne: jest.Mock;
  };

  const mockUser = {
    _id: new Types.ObjectId(),
    username: 'testuser',
  } as User;

  const mockBrand: Brand = {
    _id: new Types.ObjectId(),
    name: 'testbrand',
    user: mockUser,
  };

  const mockPaginatedResult: IPagination<Brand> = {
    items: [mockBrand],
    skip: 0,
    limit: 25,
    totalItems: 1,
    totalPages: 1,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockBrandRepository = {
      create: jest.fn().mockResolvedValue(mockBrand),
      find: jest.fn().mockResolvedValue(mockPaginatedResult),
      findOne: jest.fn().mockResolvedValue(mockBrand),
      findOneAndUpdate: jest.fn().mockResolvedValue(mockBrand),
      findOneAndDelete: jest.fn().mockResolvedValue(mockBrand),
      exists: jest.fn().mockResolvedValue(false),
    };

    mockUsersService = {
      findOne: jest.fn().mockResolvedValue(mockUser),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        {
          provide: BrandsRepositoryService,
          useValue: mockBrandRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user-id-123';
    const createBrandDto: CreateBrandDto = { name: 'testbrand' };

    it('should create a new brand and link the user', async () => {
      const result = await service.create(userId, createBrandDto);

      expect(mockUsersService.findOne).toHaveBeenCalledWith({
        _id: userId,
      });
      expect(mockBrandRepository.exists).toHaveBeenCalledWith({
        name: { $regex: createBrandDto.name, $options: 'i' },
      });
      expect(mockBrandRepository.create).toHaveBeenCalledWith({
        user: mockUser,
        name: createBrandDto.name,
      });
      expect(result).toEqual(mockBrand);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);

      await expect(service.create(userId, createBrandDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if brand with same name already exists', async () => {
      mockBrandRepository.exists.mockResolvedValue(true);

      await expect(service.create(userId, createBrandDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should return the created brand', async () => {
      const result = await service.create(userId, createBrandDto);

      expect(result).toEqual(mockBrand);
    });
  });

  describe('findAll', () => {
    it('should return paginated brands', async () => {
      const paginationDto: PaginationQueryDto = {
        skip: 0,
        limit: 25,
      };

      const result = await service.findAll({}, {}, {}, paginationDto);

      expect(mockBrandRepository.find).toHaveBeenCalledWith(
        {},
        {},
        {},
        { skip: 0, limit: 25 },
      );
      expect(result.items).toHaveLength(1);
      expect(result.totalItems).toBe(1);
    });

    it('should handle empty results', async () => {
      mockBrandRepository.find.mockResolvedValue({
        items: [],
        skip: 0,
        limit: 25,
        totalItems: 0,
        totalPages: 0,
      });

      const paginationDto: PaginationQueryDto = {
        skip: 0,
        limit: 25,
      };

      const result = await service.findAll({}, {}, {}, paginationDto);

      expect(result.items).toHaveLength(0);
      expect(result.totalItems).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a brand when found', async () => {
      const result = await service.findOne({ _id: 'brand-id-123' });

      expect(mockBrandRepository.findOne).toHaveBeenCalledWith(
        { _id: 'brand-id-123' },
        {},
        {},
      );
      expect(result).toEqual(mockBrand);
    });

    it('should throw NotFoundException when brand not found', async () => {
      mockBrandRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne({ _id: 'nonexistent' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should accept queryFilter, projection, and options', async () => {
      const queryFilter = { name: 'testbrand' };
      const projection = { name: 1 };
      const options = { sort: { name: 1 } };

      await service.findOne(queryFilter, projection, options);

      expect(mockBrandRepository.findOne).toHaveBeenCalledWith(
        queryFilter,
        projection,
        options,
      );
    });
  });
});
