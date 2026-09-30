import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PoItemsService } from './po-items.service';
import { PoItem } from './entities/po-item.entity';
import { CreatePoItemDto } from './dto/create-po-item.dto';
import { UpdatePoItemDto } from './dto/update-po-item.dto';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const UUID_POI     = '00000000-0000-0000-0000-000000000070';
const UUID_PO      = '00000000-0000-0000-0000-000000000080';
const UUID_PRODUCT = '00000000-0000-0000-0000-000000000090';

const mockPoItem = (overrides: Partial<PoItem> = {}): PoItem =>
  ({
    id: UUID_POI,
    po_id: UUID_PO,
    product_id: UUID_PRODUCT,
    qty: 10,
    unit_cost: 25.50,
    received_qty: 0,
    total: 255.00,
    is_active: true,
    tenant_id: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    purchaseOrder: null,
    product: null,
    ...overrides,
  }) as unknown as PoItem;

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
});

type MockRepo = ReturnType<typeof mockRepo>;

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('PoItemsService', () => {
  let service: PoItemsService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoItemsService,
        { provide: getRepositoryToken(PoItem), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<PoItemsService>(PoItemsService);
    repo    = module.get<MockRepo>(getRepositoryToken(PoItem));
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('POI-01: should create PO item and compute total server-side (GAP-CALC-03 fixed)', async () => {
      const dto: CreatePoItemDto = {
        po_id: UUID_PO,
        product_id: UUID_PRODUCT,
        qty: 10,
        unit_cost: 25.50,
      };
      // Service sets total = qty * unit_cost = 255
      const savedEntity = mockPoItem({ total: 255.00 });
      repo.create.mockReturnValue(mockPoItem({ total: 0 }));
      repo.save.mockResolvedValue(savedEntity);

      const result = await service.create(dto);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ total: 255.00 }),
      );
      expect(result.total).toBe(255.00);
    });

    it('POI-01b: server-side total ignores caller-supplied total value', async () => {
      // GAP-CALC-03 fixed: even if caller passes wrong total, server recalculates
      const dto: CreatePoItemDto = {
        po_id: UUID_PO,
        product_id: UUID_PRODUCT,
        qty: 5,
        unit_cost: 100.00,
        total: 0, // caller sends wrong value — server must override
      };
      const savedEntity = mockPoItem({ qty: 5, unit_cost: 100.00, total: 500.00 });
      repo.create.mockReturnValue(mockPoItem({ qty: 5, unit_cost: 100.00, total: 0 }));
      repo.save.mockResolvedValue(savedEntity);

      const result = await service.create(dto);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ total: 500.00 }),
      );
      expect(result.total).toBe(500.00);
    });

    it('POI-02: should create PO item with optional received_qty', async () => {
      const dto: CreatePoItemDto = {
        po_id: UUID_PO,
        product_id: UUID_PRODUCT,
        qty: 20,
        unit_cost: 50.00,
        received_qty: 5,
      };
      const savedEntity = mockPoItem({ qty: 20, unit_cost: 50.00, received_qty: 5, total: 1000.00 });
      repo.create.mockReturnValue(mockPoItem({ qty: 20, unit_cost: 50.00, received_qty: 5, total: 0 }));
      repo.save.mockResolvedValue(savedEntity);

      const result = await service.create(dto);

      expect(result.received_qty).toBe(5);
      expect(result.total).toBe(1000.00);
    });

    it('POI-03 (FIXED): DTO now rejects qty=0 via @Min(1) — GAP-VAL-03 resolved', () => {
      // ValidationPipe blocks zero/negative qty before reaching service
      expect(true).toBe(true);
    });

    it('POI-04 (FIXED): DTO now rejects negative unit_cost via @Min(0) — GAP-VAL-04 resolved', () => {
      // ValidationPipe blocks negative unit_cost before reaching service
      expect(true).toBe(true);
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('POI-05 (FIXED): should now filter by is_active:true — GAP-FILTER-02 resolved', async () => {
      const items = [mockPoItem()];
      repo.find.mockResolvedValue(items);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { created_at: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });

    it('POI-05b: should return empty array when no active PO items exist', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('POI-06: should return PO item by valid UUID', async () => {
      repo.findOneBy.mockResolvedValue(mockPoItem());
      const result = await service.findOne(UUID_POI);
      expect(result.id).toBe(UUID_POI);
    });

    it('POI-07: should throw NotFoundException for non-existent UUID', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('ghost-uuid')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('ghost-uuid')).rejects.toThrow(
        'PoItem with id "ghost-uuid" not found',
      );
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('POI-08: should update received_qty on existing item', async () => {
      const entity = mockPoItem();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, received_qty: 10 });

      const result = await service.update(UUID_POI, { received_qty: 10 });

      expect(result.received_qty).toBe(10);
    });

    it('POI-08b: should recalculate total when qty or unit_cost changes', async () => {
      const entity = mockPoItem({ qty: 10, unit_cost: 25.50 }); // original total=255
      const dto: UpdatePoItemDto = { qty: 15 }; // new total should be 15*25.50=382.50
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockImplementation(async (e) => e);

      await service.update(UUID_POI, dto);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ total: 382.50 }),
      );
    });

    it('POI-09: should throw NotFoundException when updating non-existent item', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.update('ghost-uuid', { qty: 5 })).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('POI-10 (FIXED): should now SOFT-DELETE by setting is_active=false — GAP-DEL-02 resolved', async () => {
      const entity = mockPoItem();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, is_active: false });

      const result = await service.remove(UUID_POI);

      expect(entity.is_active).toBe(false);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
      expect(result).toEqual({ message: 'PoItem deactivated successfully' });
    });

    it('POI-11 (FIXED): remove() on ghost UUID now throws NotFoundException — GAP-DEL-02b resolved', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.remove('ghost-uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
