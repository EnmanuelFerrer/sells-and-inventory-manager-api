import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductRepositoryService } from './repositories/product-repository.service';
import { UsersService } from '../users/users.service';
import { BrandsService } from '../brands/brands.service';
import { Product } from '../common/schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import { IPagination } from '../common/interfaces/pagination.interface';
import { Types } from 'mongoose';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockProductRepository: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    count: jest.Mock;
  };
  let mockUsersService: {
    findOne: jest.Mock;
  };
  let mockBrandsService: {
    findOne: jest.Mock;
    appendUser: jest.Mock;
  };

  const mockUser = {
    _id: new Types.ObjectId(),
    username: 'testuser',
  };

  const mockBrand = {
    _id: new Types.ObjectId(),
    name: 'Test Brand',
    users: ['user-id-123'],
  };

  const mockProduct: Product = {
    _id: new Types.ObjectId(),
    name: 'Test Product',
    cost: 100,
    gain: 20,
    price: 120,
    stock: 0,
    isActive: true,
    user: mockUser._id,
    brand: mockBrand._id,
  };

  const mockPaginatedResult: IPagination<Product> = {
    items: [mockProduct],
    skip: 0,
    limit: 25,
    totalItems: 1,
    totalPages: 1,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockProductRepository = {
      create: jest.fn().mockResolvedValue(mockProduct),
      find: jest.fn().mockResolvedValue(mockPaginatedResult),
      findOne: jest.fn().mockResolvedValue(mockProduct),
      count: jest.fn().mockResolvedValue(5),
    };

    mockUsersService = {
      findOne: jest.fn().mockResolvedValue(mockUser),
    };

    mockBrandsService = {
      findOne: jest.fn().mockResolvedValue(mockBrand),
      appendUser: jest.fn().mockResolvedValue(mockBrand),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductRepositoryService,
          useValue: mockProductRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: BrandsService,
          useValue: mockBrandsService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user-id-123';
    const brandId = 'brand-id-456';

    it('should create a product with gain calculated from cost', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        cost: 100,
        gain: 20,
      };

      const result = await service.create(userId, brandId, createProductDto);

      expect(mockUsersService.findOne).toHaveBeenCalledWith({
        _id: userId,
      });
      expect(mockBrandsService.findOne).toHaveBeenCalledWith({
        _id: brandId,
        users: { $elemMatch: { $eq: userId } },
      });
      expect(mockProductRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Product',
          cost: 100,
          gain: 20,
          price: 120,
          user: mockUser,
          brand: mockBrand,
        }),
      );
      expect(result).toEqual(mockProduct);
    });

    it('should create a product with price calculated from cost', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        cost: 100,
        price: 120,
      };

      const result = await service.create(userId, brandId, createProductDto);

      expect(mockProductRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          gain: 20,
          price: 120,
        }),
      );
      expect(result).toEqual(mockProduct);
    });

    it('should throw ConflictException if both gain and price are set', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        cost: 100,
        gain: 20,
        price: 120,
      };

      await expect(
        service.create(userId, brandId, createProductDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if neither gain nor price is set', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        cost: 100,
      };

      await expect(
        service.create(userId, brandId, createProductDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if gain is greater than 30%', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        cost: 100,
        price: 135,
      };

      await expect(
        service.create(userId, brandId, createProductDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if price is less than cost', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        cost: 100,
        price: 90,
      };

      await expect(
        service.create(userId, brandId, createProductDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should link user to brand if not already linked', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        cost: 100,
        gain: 20,
      };

      mockBrandsService.findOne
        .mockRejectedValueOnce(new NotFoundException())
        .mockResolvedValueOnce(mockBrand);

      await service.create(userId, brandId, createProductDto);

      expect(mockBrandsService.appendUser).toHaveBeenCalledWith(
        brandId,
        userId,
      );
      expect(mockBrandsService.findOne).toHaveBeenCalledTimes(2);
    });

    it('should throw InternalServerErrorException if product creation fails', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        cost: 100,
        gain: 20,
      };

      mockProductRepository.create.mockResolvedValue(null);

      await expect(
        service.create(userId, brandId, createProductDto),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const paginationDto: PaginationQueryDto = {
        skip: 0,
        limit: 25,
      };

      const result = await service.find({}, {}, {}, paginationDto);

      expect(mockProductRepository.find).toHaveBeenCalledWith(
        {},
        {},
        {},
        { skip: 0, limit: 25 },
      );
      expect(result.items).toHaveLength(1);
      expect(result.totalItems).toBe(1);
    });

    it('should handle empty results', async () => {
      mockProductRepository.find.mockResolvedValue({
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

      const result = await service.find({}, {}, {}, paginationDto);

      expect(result.items).toHaveLength(0);
      expect(result.totalItems).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a product when found', async () => {
      const result = await service.findOne({ _id: 'product-id-789' });

      expect(mockProductRepository.findOne).toHaveBeenCalledWith(
        { _id: 'product-id-789', 'user._id': undefined },
        {},
        {},
      );
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne({ _id: 'nonexistent' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should accept queryFilter, projection, and options', async () => {
      const queryFilter = { name: 'Test Product' };
      const projection = { name: 1 };
      const options = { sort: { name: 1 } };

      await service.findOne(queryFilter, projection, options);

      expect(mockProductRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining(queryFilter),
        projection,
        options,
      );
    });
  });

  describe('count', () => {
    it('should return the count of products matching the filter', async () => {
      const queryFilter = { isActive: true };
      const result = await service.count(queryFilter);

      expect(mockProductRepository.count).toHaveBeenCalledWith(queryFilter);
      expect(result).toBe(5);
    });

    it('should return 0 when no products match', async () => {
      mockProductRepository.count.mockResolvedValue(0);

      const result = await service.count({ name: 'Nonexistent' });

      expect(result).toBe(0);
    });
  });
});
