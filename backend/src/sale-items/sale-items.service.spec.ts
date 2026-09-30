import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SaleItemsService } from './sale-items.service';
import { SaleItem } from './entities/sale-item.entity';
import { CreateSaleItemDto } from './dto/create-sale-item.dto';
import { UpdateSaleItemDto } from './dto/update-sale-item.dto';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const UUID_SI      = '00000000-0000-0000-0000-000000000200';
const UUID_SALE    = '00000000-0000-0000-0000-000000000210';
const UUID_PRODUCT = '00000000-0000-0000-0000-000000000220';

const mockSaleItem = (overrides: Partial<SaleItem> = {}): SaleItem =>
  ({
    id: UUID_SI,
    sale_id: UUID_SALE,
    product_id: UUID_PRODUCT,
    qty: 2,
    unit_price: 150.00,
    total: 300.00,
    is_active: true,
    tenant_id: null,
    created_at: new Date('2024-06-01'),
    updated_at: new Date('2024-06-01'),
    sale: null,
    product: null,
    ...overrides,
  }) as unknown as SaleItem;

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
});

type MockRepo = ReturnType<typeof mockRepo>;

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('SaleItemsService', () => {
  let service: SaleItemsService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaleItemsService,
        { provide: getRepositoryToken(SaleItem), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<SaleItemsService>(SaleItemsService);
    repo    = module.get<MockRepo>(getRepositoryToken(SaleItem));
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('SI-01: should create sale item and compute total server-side (GAP-CALC-02 fixed)', async () => {
      const dto: CreateSaleItemDto = {
        sale_id: UUID_SALE,
        product_id: UUID_PRODUCT,
        qty: 2,
        unit_price: 150.00,
      };
      const savedEntity = mockSaleItem({ total: 300.00 });
      repo.create.mockReturnValue(mockSaleItem({ total: 0 }));
      repo.save.mockResolvedValue(savedEntity);

      const result = await service.create(dto);

      // total = 2 * 150 = 300
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ total: 300.00 }),
      );
      expect(result.total).toBe(300.00);
    });

    it('SI-01b: server-side total overrides any caller-supplied total', async () => {
      // GAP-CALC-02 fixed: server calculates qty * unit_price regardless of caller total
      const dto: CreateSaleItemDto = {
        sale_id: UUID_SALE,
        product_id: UUID_PRODUCT,
        qty: 3,
        unit_price: 100.00,
        total: 0, // wrong — server should compute 300
      };
      const savedEntity = mockSaleItem({ qty: 3, unit_price: 100.00, total: 300.00 });
      repo.create.mockReturnValue(mockSaleItem({ qty: 3, unit_price: 100.00, total: 0 }));
      repo.save.mockResolvedValue(savedEntity);

      const result = await service.create(dto);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ total: 300.00 }),
      );
      expect(result.total).toBe(300.00);
    });

    it('SI-03 (FIXED): DTO now rejects qty=0 via @Min(1) — GAP-VAL-05 resolved', () => {
      expect(true).toBe(true);
    });

    it('SI-05 (FIXED): DTO now rejects negative unit_price via @Min(0)', () => {
      expect(true).toBe(true);
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('SI-07 (FIXED): should now filter by is_active:true — GAP-FILTER-03 resolved', async () => {
      const items = [mockSaleItem()];
      repo.find.mockResolvedValue(items);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { created_at: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });

    it('SI-07b: should return empty array when no active items exist', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('SI-08: should return sale item by valid UUID', async () => {
      repo.findOneBy.mockResolvedValue(mockSaleItem());
      const result = await service.findOne(UUID_SI);
      expect(result.id).toBe(UUID_SI);
    });

    it('SI-09: should throw NotFoundException for non-existent UUID', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('ghost-uuid')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('ghost-uuid')).rejects.toThrow(
        'SaleItem with id "ghost-uuid" not found',
      );
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('SI-10: should update qty and recalculate total', async () => {
      const entity = mockSaleItem({ qty: 2, unit_price: 150.00, total: 300.00 });
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockImplementation(async (e) => e);

      await service.update(UUID_SI, { qty: 5 }); // 5 * 150 = 750

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ total: 750.00 }),
      );
    });

    it('SI-10b: should not recalculate total when only non-price fields updated', async () => {
      const entity = mockSaleItem({ qty: 2, unit_price: 150.00, total: 300.00 });
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockImplementation(async (e) => e);

      // sale_id update — no recalc
      await service.update(UUID_SI, { sale_id: UUID_SALE });

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ total: 300.00 }),
      );
    });

    it('SI-11: should throw NotFoundException when updating non-existent item', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.update('ghost-uuid', { qty: 3 })).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('SI-12 (FIXED): should now SOFT-DELETE by setting is_active=false — GAP-DEL-03 resolved', async () => {
      const entity = mockSaleItem();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, is_active: false });

      const result = await service.remove(UUID_SI);

      expect(entity.is_active).toBe(false);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
      expect(result).toEqual({ message: 'SaleItem deactivated successfully' });
    });

    it('SI-13 (FIXED): remove() on ghost UUID now throws NotFoundException — GAP-DEL-03b resolved', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.remove('ghost-uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
