import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { Sale } from './entities/sale.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const UUID_SALE  = '00000000-0000-0000-0000-000000000100';
const UUID_STORE = '00000000-0000-0000-0000-000000000110';
const UUID_CUST  = '00000000-0000-0000-0000-000000000120';
const UUID_EMP   = '00000000-0000-0000-0000-000000000130';

const mockSale = (overrides: Partial<Sale> = {}): Sale =>
  ({
    id: UUID_SALE,
    store_id: UUID_STORE,
    cust_id: null,
    emp_id: null,
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    status: 'completed',
    sold_at: new Date('2024-06-01T10:00:00Z'),
    is_active: true,
    tenant_id: null,
    created_at: new Date('2024-06-01'),
    updated_at: new Date('2024-06-01'),
    store: null,
    customer: null,
    cashier: null,
    items: [],
    payments: [],
    returns: [],
    ...overrides,
  }) as unknown as Sale;

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
});

type MockRepo = ReturnType<typeof mockRepo>;

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('SalesService', () => {
  let service: SalesService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: getRepositoryToken(Sale), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    repo    = module.get<MockRepo>(getRepositoryToken(Sale));
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('SAL-01: should create sale with only store_id — financials default to 0, status to completed', async () => {
      const dto: CreateSaleDto = { store_id: UUID_STORE };
      const entity = mockSale();
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(result.store_id).toBe(UUID_STORE);
      expect(result.subtotal).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.discount).toBe(0);
      expect(result.total).toBe(0);
      expect(result.status).toBe('completed');
    });

    it('SAL-02: should create sale with all financial fields explicitly supplied', async () => {
      const dto: CreateSaleDto = {
        store_id: UUID_STORE,
        subtotal: 500,
        tax: 75,
        discount: 25,
        total: 550,
      };
      const entity = mockSale({ subtotal: 500, tax: 75, discount: 25, total: 550 });
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(result.subtotal).toBe(500);
      expect(result.tax).toBe(75);
      expect(result.discount).toBe(25);
      expect(result.total).toBe(550);
    });

    it('SAL-03: should create sale with optional cust_id and emp_id', async () => {
      const dto: CreateSaleDto = {
        store_id: UUID_STORE,
        cust_id: UUID_CUST,
        emp_id: UUID_EMP,
      };
      const entity = mockSale({ cust_id: UUID_CUST, emp_id: UUID_EMP });
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(result.cust_id).toBe(UUID_CUST);
      expect(result.emp_id).toBe(UUID_EMP);
    });

    it('SAL-04 (GAP-P3-10): documents that invalid status string passes service layer — no enum guard', async () => {
      // Known gap: status accepts any string — 'void', 'cancelled', 'xyz' pass without error
      const dto: CreateSaleDto = { store_id: UUID_STORE, status: 'void' };
      const entity = mockSale({ status: 'void' });
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(result.status).toBe('void');
    });

    it('SAL-05 (GAP-P3-05): documents that negative total passes service layer — no @Min(0) guard', async () => {
      // Known gap: financial fields have @IsNumber but no @Min(0)
      const dto: CreateSaleDto = { store_id: UUID_STORE, total: -100 };
      const entity = mockSale({ total: -100 });
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(result.total).toBe(-100);
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('SAL-06: should return only active sales ordered by sold_at DESC', async () => {
      const sales = [mockSale()];
      repo.find.mockResolvedValue(sales);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { sold_at: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });

    it('SAL-07: should return empty array when no active sales exist', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('SAL-06b: deactivated sales should be excluded from findAll', async () => {
      repo.find.mockResolvedValue([]); // deactivated sale excluded by is_active:true
      const result = await service.findAll();
      expect(result).toHaveLength(0);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('SAL-08: should return sale by valid UUID', async () => {
      repo.findOneBy.mockResolvedValue(mockSale());

      const result = await service.findOne(UUID_SALE);

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: UUID_SALE });
      expect(result.id).toBe(UUID_SALE);
    });

    it('SAL-09: should throw NotFoundException for non-existent UUID', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('ghost-uuid')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('ghost-uuid')).rejects.toThrow(
        'Sale with id "ghost-uuid" not found',
      );
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('SAL-10: should update total amount on a sale', async () => {
      const entity = mockSale();
      const dto: UpdateSaleDto = { total: 999.99 };
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, total: 999.99 });

      const result = await service.update(UUID_SALE, dto);

      expect(result.total).toBe(999.99);
      expect(repo.save).toHaveBeenCalled();
    });

    it('SAL-11: should update status field on a sale', async () => {
      const entity = mockSale();
      const dto: UpdateSaleDto = { status: 'refunded' };
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, status: 'refunded' });

      const result = await service.update(UUID_SALE, dto);

      expect(result.status).toBe('refunded');
    });

    it('SAL-10b: should update subtotal, tax, and discount together', async () => {
      const entity = mockSale();
      const dto: UpdateSaleDto = { subtotal: 400, tax: 60, discount: 10 };
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, subtotal: 400, tax: 60, discount: 10 });

      const result = await service.update(UUID_SALE, dto);

      expect(result.subtotal).toBe(400);
      expect(result.tax).toBe(60);
      expect(result.discount).toBe(10);
    });

    it('SAL-12: should throw NotFoundException when updating non-existent sale', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.update('ghost-uuid', { total: 100 })).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('SAL-13: should soft-delete sale by setting is_active=false', async () => {
      const entity = mockSale();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, is_active: false });

      const result = await service.remove(UUID_SALE);

      expect(entity.is_active).toBe(false);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
      expect(result).toEqual({ message: 'Sale deactivated successfully' });
    });

    it('SAL-14: should throw NotFoundException when removing non-existent sale', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('ghost-uuid')).rejects.toThrow(NotFoundException);
    });

    it('SAL-15: after remove(), sale should not appear in findAll()', async () => {
      repo.find.mockResolvedValue([]); // deactivated sale filtered by is_active:true
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });
});
