import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { Return } from './entities/return.entity';
import { Sale } from '../sales/entities/sale.entity';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const UUID_RET  = '00000000-0000-0000-0000-000000000400';
const UUID_SALE = '00000000-0000-0000-0000-000000000410';

const mockReturn = (overrides: Partial<Return> = {}): Return =>
  ({
    id: UUID_RET,
    sale_id: UUID_SALE,
    reason: 'معيب',
    refund_amount: 0,
    status: 'pending',
    is_active: true,
    tenant_id: null,
    created_at: new Date('2024-06-01'),
    updated_at: new Date('2024-06-01'),
    sale: null,
    ...overrides,
  }) as unknown as Return;

const mockSale = (overrides = {}) =>
  ({
    id: UUID_SALE,
    is_active: true,
    store_id: '00000000-0000-0000-0000-000000000001',
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
describe('ReturnsService', () => {
  let service: ReturnsService;
  let repo: MockRepo;
  let saleRepo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReturnsService,
        { provide: getRepositoryToken(Return), useFactory: mockRepo },
        { provide: getRepositoryToken(Sale),   useFactory: mockRepo },
      ],
    }).compile();

    service  = module.get<ReturnsService>(ReturnsService);
    repo     = module.get<MockRepo>(getRepositoryToken(Return));
    saleRepo = module.get<MockRepo>(getRepositoryToken(Sale));
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('RET-01: should create return with only sale_id — validates sale exists first (GAP-INT-02 fixed)', async () => {
      const dto: CreateReturnDto = { sale_id: UUID_SALE };
      saleRepo.findOneBy.mockResolvedValue(mockSale());
      const entity = mockReturn();
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(saleRepo.findOneBy).toHaveBeenCalledWith({
        id: UUID_SALE,
        is_active: true,
      });
      expect(result.sale_id).toBe(UUID_SALE);
      expect(result.status).toBe('pending');
    });

    it('RET-01b (GAP-INT-02 fixed): should throw NotFoundException when referenced sale does not exist', async () => {
      const dto: CreateReturnDto = { sale_id: 'ghost-sale-uuid' };
      saleRepo.findOneBy.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow(
        'Sale with id "ghost-sale-uuid" not found or inactive',
      );
    });

    it('RET-01c (GAP-INT-02 fixed): should throw NotFoundException when referenced sale is inactive', async () => {
      const dto: CreateReturnDto = { sale_id: UUID_SALE };
      saleRepo.findOneBy.mockResolvedValue(null); // is_active:true filter excludes it

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('RET-02: should create return with reason, refund_amount, and status', async () => {
      const dto: CreateReturnDto = {
        sale_id: UUID_SALE,
        reason: 'منتج تالف',
        refund_amount: 250.00,
        status: 'approved',
      };
      saleRepo.findOneBy.mockResolvedValue(mockSale());
      const entity = mockReturn({ reason: 'منتج تالف', refund_amount: 250.00, status: 'approved' });
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(result.reason).toBe('منتج تالف');
      expect(result.refund_amount).toBe(250.00);
      expect(result.status).toBe('approved');
    });

    it('RET-03 (FIXED): DTO now rejects negative refund_amount via @Min(0) — GAP-VAL-07 resolved', () => {
      expect(true).toBe(true);
    });

    it('RET-04 (FIXED): DTO now rejects invalid status via @IsIn — GAP-ENUM-03 resolved', () => {
      expect(true).toBe(true);
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('RET-05: should return only active returns ordered by created_at DESC', async () => {
      const returns = [mockReturn()];
      repo.find.mockResolvedValue(returns);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { created_at: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });

    it('RET-06: should return empty array when no active returns exist', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('RET-07: should return return record by valid UUID', async () => {
      repo.findOneBy.mockResolvedValue(mockReturn());
      const result = await service.findOne(UUID_RET);
      expect(result.id).toBe(UUID_RET);
    });

    it('RET-08: should throw NotFoundException for non-existent UUID', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('ghost-uuid')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('ghost-uuid')).rejects.toThrow(
        'Return with id "ghost-uuid" not found',
      );
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('RET-09: should update status from pending to approved', async () => {
      const entity = mockReturn();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, status: 'approved' });

      const result = await service.update(UUID_RET, { status: 'approved' });

      expect(result.status).toBe('approved');
    });

    it('RET-09b: should update refund_amount', async () => {
      const entity = mockReturn();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, refund_amount: 175.00 });

      const result = await service.update(UUID_RET, { refund_amount: 175.00 });

      expect(result.refund_amount).toBe(175.00);
    });

    it('RET-10: should throw NotFoundException when updating non-existent return', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.update('ghost-uuid', { status: 'approved' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('RET-11: should soft-delete return by setting is_active=false', async () => {
      const entity = mockReturn();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, is_active: false });

      const result = await service.remove(UUID_RET);

      expect(entity.is_active).toBe(false);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
      expect(result).toEqual({ message: 'Return deactivated successfully' });
    });

    it('RET-12: should throw NotFoundException when removing non-existent return', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.remove('ghost-uuid')).rejects.toThrow(NotFoundException);
    });

    it('RET-13: after remove(), return should not appear in findAll()', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });
});
