import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const VALID_UUID = '00000000-0000-0000-0000-000000000001';
const VALID_CAT_UUID = '00000000-0000-0000-0000-000000000002';

const mockProduct = (): Product =>
  ({
    id: VALID_UUID,
    cat_id: VALID_CAT_UUID,
    sku: 'SKU-001',
    barcode: '1234567890',
    name: 'لابتوب ديل',
    price: 3500,
    unit: 'piece',
    is_active: true,
    tenant_id: null,
    created_at: new Date(),
    updated_at: new Date(),
    category: null,
    inventory: [],
    saleItems: [],
    poItems: [],
  }) as unknown as Product;

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
});

type MockRepo = ReturnType<typeof mockRepo>;

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('ProductsService', () => {
  let service: ProductsService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repo = module.get<MockRepo>(getRepositoryToken(Product));
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('P-01: should create product with required fields', async () => {
      const dto: CreateProductDto = {
        cat_id: VALID_CAT_UUID,
        sku: 'SKU-001',
        name: 'لابتوب ديل',
        price: 3500,
      };
      const entity = mockProduct();
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(result.sku).toBe('SKU-001');
    });

    it('P-08 (GAP-02): documents that negative price currently passes service layer', async () => {
      // This is a known gap — @Min(0) is missing from DTO
      // Service layer itself does not validate — relies on DTO validation pipe
      const dto: CreateProductDto = {
        cat_id: VALID_CAT_UUID,
        sku: 'SKU-NEG',
        name: 'منتج سالب',
        price: -50,
      };
      const entity = { ...mockProduct(), price: -50, sku: 'SKU-NEG' };
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      // Documents bug: price -50 saved without error at service level
      expect(result.price).toBe(-50);
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('P-12: should return only active products ordered by created_at DESC', async () => {
      const products = [mockProduct()];
      repo.find.mockResolvedValue(products);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { created_at: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no products are active', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('P-13: should return product by valid UUID', async () => {
      repo.findOneBy.mockResolvedValue(mockProduct());
      const result = await service.findOne(VALID_UUID);
      expect(result.id).toBe(VALID_UUID);
    });

    it('P-14: should throw NotFoundException for non-existent UUID', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('bad-uuid')).rejects.toThrow(NotFoundException);
    });

    it('GAP-05: findOne returns soft-deleted product — known gap', async () => {
      const deleted = { ...mockProduct(), is_active: false };
      repo.findOneBy.mockResolvedValue(deleted);
      const result = await service.findOne(VALID_UUID);
      // Should be 404 after fix — currently returns deleted record
      expect(result.is_active).toBe(false);
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('P-15: should update product price', async () => {
      const entity = mockProduct();
      const dto: UpdateProductDto = { price: 99.99 };
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, price: 99.99 });

      const result = await service.update(VALID_UUID, dto);

      expect(result.price).toBe(99.99);
    });

    it('should throw NotFoundException when updating non-existent product', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.update('bad-uuid', {})).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('P-16: should soft-delete product by setting is_active=false', async () => {
      const entity = mockProduct();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, is_active: false });

      const result = await service.remove(VALID_UUID);

      expect(entity.is_active).toBe(false);
      expect(result).toEqual({ message: 'Product deactivated successfully' });
    });

    it('should throw NotFoundException when removing non-existent product', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.remove('bad-uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
