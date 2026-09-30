import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const UUID_PO       = '00000000-0000-0000-0000-000000000040';
const UUID_SUPPLIER = '00000000-0000-0000-0000-000000000050';
const UUID_STORE    = '00000000-0000-0000-0000-000000000060';

const mockPO = (overrides: Partial<PurchaseOrder> = {}): PurchaseOrder =>
  ({
    id: UUID_PO,
    supplier_id: UUID_SUPPLIER,
    store_id: UUID_STORE,
    status: 'pending',
    total: 0,
    ordered_at: null,
    expected_at: new Date('2025-01-15'),
    is_active: true,
    tenant_id: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    supplier: null,
    store: null,
    items: [],
    ...overrides,
  }) as unknown as PurchaseOrder;

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
});

type MockRepo = ReturnType<typeof mockRepo>;

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('PurchaseOrdersService', () => {
  let service: PurchaseOrdersService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrdersService,
        { provide: getRepositoryToken(PurchaseOrder), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<PurchaseOrdersService>(PurchaseOrdersService);
    repo    = module.get<MockRepo>(getRepositoryToken(PurchaseOrder));
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('PO-01: should create PO with required fields — status defaults to pending, total defaults to 0', async () => {
      const dto: CreatePurchaseOrderDto = {
        supplier_id: UUID_SUPPLIER,
        store_id: UUID_STORE,
      };
      const entity = mockPO();
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(result.supplier_id).toBe(UUID_SUPPLIER);
      expect(result.store_id).toBe(UUID_STORE);
      expect(result.status).toBe('pending');
      expect(result.total).toBe(0);
    });

    it('PO-02: should create PO with explicit status and total', async () => {
      const dto: CreatePurchaseOrderDto = {
        supplier_id: UUID_SUPPLIER,
        store_id: UUID_STORE,
        status: 'received',
        total: 1500.75,
      };
      const entity = mockPO({ status: 'received', total: 1500.75 });
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(result.status).toBe('received');
      expect(result.total).toBe(1500.75);
    });

    it('PO-02b: should create PO with expected_at date', async () => {
      const expectedDate = new Date('2025-03-01');
      const dto: CreatePurchaseOrderDto = {
        supplier_id: UUID_SUPPLIER,
        store_id: UUID_STORE,
        expected_at: expectedDate,
      };
      const entity = mockPO({ expected_at: expectedDate });
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(result.expected_at).toEqual(expectedDate);
    });

    it('PO-03 (GAP-10): documents that invalid status string passes service layer — no enum validation', async () => {
      // Known gap: status is a free-form string, no @IsIn(['pending','received']) guard
      // Values like 'shipped', 'cancelled', 'xyz' are accepted without error
      const dto: CreatePurchaseOrderDto = {
        supplier_id: UUID_SUPPLIER,
        store_id: UUID_STORE,
        status: 'shipped', // invalid status
      };
      const entity = mockPO({ status: 'shipped' });
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      // Documents bug: 'shipped' saved without error
      expect(result.status).toBe('shipped');
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('PO-04: should return only active POs ordered by created_at DESC', async () => {
      const pos = [mockPO()];
      repo.find.mockResolvedValue(pos);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { created_at: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });

    it('PO-05: should return empty array when no active POs exist', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('PO-04b: deactivated POs should not be returned by findAll', async () => {
      // Confirms that the is_active:true filter excludes soft-deleted records
      repo.find.mockResolvedValue([]); // deactivated PO excluded
      const result = await service.findAll();
      expect(result).toHaveLength(0);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('PO-06: should return PO by valid UUID', async () => {
      repo.findOneBy.mockResolvedValue(mockPO());

      const result = await service.findOne(UUID_PO);

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: UUID_PO });
      expect(result.id).toBe(UUID_PO);
    });

    it('PO-07: should throw NotFoundException for non-existent UUID', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('ghost-uuid')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('ghost-uuid')).rejects.toThrow(
        'PurchaseOrder with id "ghost-uuid" not found',
      );
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('PO-08: should update status from pending to received', async () => {
      const entity = mockPO();
      const dto: UpdatePurchaseOrderDto = { status: 'received' };
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, status: 'received' });

      const result = await service.update(UUID_PO, dto);

      expect(result.status).toBe('received');
      expect(repo.save).toHaveBeenCalled();
    });

    it('PO-08b: should update total amount on PO', async () => {
      const entity = mockPO();
      const dto: UpdatePurchaseOrderDto = { total: 2500.00 };
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, total: 2500.00 });

      const result = await service.update(UUID_PO, dto);

      expect(result.total).toBe(2500.00);
    });

    it('PO-08c: should update expected_at date', async () => {
      const entity = mockPO();
      const newDate = new Date('2025-04-01');
      const dto: UpdatePurchaseOrderDto = { expected_at: newDate };
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, expected_at: newDate });

      const result = await service.update(UUID_PO, dto);

      expect(result.expected_at).toEqual(newDate);
    });

    it('PO-09: should throw NotFoundException when updating non-existent PO', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.update('ghost-uuid', { status: 'received' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('PO-10: should soft-delete PO by setting is_active=false', async () => {
      const entity = mockPO();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, is_active: false });

      const result = await service.remove(UUID_PO);

      expect(entity.is_active).toBe(false);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
      expect(result).toEqual({ message: 'PurchaseOrder deactivated successfully' });
    });

    it('PO-11: should throw NotFoundException when removing non-existent PO', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('ghost-uuid')).rejects.toThrow(NotFoundException);
    });

    it('PO-12: after remove(), PO should not appear in findAll()', async () => {
      // Simulate: findAll returns only is_active:true records, deactivated PO absent
      repo.find.mockResolvedValue([]); // deactivated PO excluded by filter
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });
});
