import { Test, TestingModule } from '@nestjs/testing';
import { BrandsService } from './brands.service';
import { getModelToken } from '@nestjs/mongoose';
import { Brand } from '../common/schemas/brand.schema';
import { UsersService } from '../users/users.service';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

describe('BrandsService', () => {
  let service: BrandsService;
  let mockBrandModel: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    findOneAndDelete: jest.Mock;
    exists: jest.Mock;
  };

  const mockUser = {
    _id: 'user-id-123',
  };

  const mockBrand = {
    _id: 'brand-id-123',
    name: 'testbrand',
  };

  const mockUserService = {
    findOne: jest.fn().mockResolvedValue(mockUser),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const createQueryMock = (resolvedValue: unknown) => {
      const mockQuery = Promise.resolve(resolvedValue);
      return mockQuery;
    };

    mockBrandModel = {
      create: jest.fn().mockResolvedValue(mockBrand),
      find: jest.fn().mockImplementation(() => createQueryMock([mockBrand])),
      findOne: jest.fn().mockImplementation(() => createQueryMock(mockBrand)),
      findOneAndUpdate: jest
        .fn()
        .mockImplementation(() => createQueryMock(mockBrand)),
      findOneAndDelete: jest
        .fn()
        .mockImplementation(() => createQueryMock(mockBrand)),
      exists: jest.fn().mockImplementation(() => createQueryMock(true)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        {
          provide: getModelToken(Brand.name),
          useValue: mockBrandModel,
        },
        {
          provide: UsersService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new brand', async () => {
      mockBrandModel.exists.mockImplementation(() => Promise.resolve(false));

      const result = await service.create(mockUser._id, {
        name: mockBrand.name,
      });

      expect(mockBrandModel.create).toHaveBeenCalledWith({
        name: mockBrand.name,
      });
      expect(result).toEqual(mockBrand);
    });

    it('should throw ConflictException if user is not found', async () => {
      mockUserService.findOne.mockImplementation(() => Promise.resolve(null));

      await expect(
        service.create(mockUser._id, { name: mockBrand.name }),
      ).rejects.toThrow(NotFoundException);
    });

    it('it should throw ConflictException if brand with same name already exists', async () => {
      mockUserService.findOne.mockImplementation(() =>
        Promise.resolve(mockUser),
      );
      await expect(
        service.create(mockUser._id, { name: mockBrand.name }),
      ).rejects.toThrow(ConflictException);
    });

    it('it should throw InternalServerError if an error occurs pushing the user into the brand', async () => {
      mockUserService.findOne.mockImplementation(() =>
        Promise.resolve(mockUser),
      );
      mockBrandModel.exists.mockImplementationOnce(() =>
        Promise.resolve(false),
      );

      mockBrandModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.create(mockUser._id, { name: mockBrand.name }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
