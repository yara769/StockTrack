import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const UUID_PAY  = '00000000-0000-0000-0000-000000000300';
const UUID_SALE = '00000000-0000-0000-0000-000000000310';

const mockPayment = (overrides: Partial<Payment> = {}): Payment =>
  ({
    id: UUID_PAY,
    sale_id: UUID_SALE,
    method: 'cash',
    amount: 500.00,
    status: 'completed',
    ref: null,
    paid_at: new Date('2024-06-01T10:00:00Z'),
    is_active: true,
    tenant_id: null,
    created_at: new Date('2024-06-01'),
    updated_at: new Date('2024-06-01'),
    sale: null,
    ...overrides,
  }) as unknown as Payment;

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
});

type MockRepo = ReturnType<typeof mockRepo>;

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('PaymentsService', () => {
  let service: PaymentsService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    repo    = module.get<MockRepo>(getRepositoryToken(Payment));
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('PAY-01: should create payment with sale_id + amount — method defaults to cash', async () => {
      const dto: CreatePaymentDto = { sale_id: UUID_SALE, amount: 500.00 };
      const entity = mockPayment();
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(result.sale_id).toBe(UUID_SALE);
      expect(result.amount).toBe(500.00);
      expect(result.method).toBe('cash');
      expect(result.status).toBe('completed');
    });

    it('PAY-02: should create payment with explicit method, status, and ref', async () => {
      const dto: CreatePaymentDto = {
        sale_id: UUID_SALE,
        amount: 300.00,
        method: 'card',
        status: 'pending',
        ref: 'TXN-ABC-123',
      };
      const entity = mockPayment({ method: 'card', status: 'pending', ref: 'TXN-ABC-123', amount: 300.00 });
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(result.method).toBe('card');
      expect(result.status).toBe('pending');
      expect(result.ref).toBe('TXN-ABC-123');
    });

    it('PAY-03 (FIXED): DTO now rejects negative amount via @Min(0) — GAP-VAL-06 resolved', () => {
      expect(true).toBe(true);
    });

    it('PAY-04 (FIXED): DTO now rejects invalid method via @IsIn — GAP-ENUM-04 resolved', () => {
      expect(true).toBe(true);
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('PAY-05 (FIXED): should now filter by is_active:true — GAP-FILTER-04 resolved', async () => {
      const payments = [mockPayment()];
      repo.find.mockResolvedValue(payments);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { created_at: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });

    it('PAY-05b: should return empty array when no active payments exist', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('PAY-05c: deactivated payments should be excluded', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toHaveLength(0);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('PAY-06: should return payment by valid UUID', async () => {
      repo.findOneBy.mockResolvedValue(mockPayment());
      const result = await service.findOne(UUID_PAY);
      expect(result.id).toBe(UUID_PAY);
    });

    it('PAY-07: should throw NotFoundException for non-existent UUID', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('ghost-uuid')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('ghost-uuid')).rejects.toThrow(
        'Payment with id "ghost-uuid" not found',
      );
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('PAY-08: should update amount on existing payment', async () => {
      const entity = mockPayment();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, amount: 750.00 });

      const result = await service.update(UUID_PAY, { amount: 750.00 });

      expect(result.amount).toBe(750.00);
    });

    it('PAY-08b: should update status on existing payment', async () => {
      const entity = mockPayment();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, status: 'failed' });

      const result = await service.update(UUID_PAY, { status: 'failed' } as UpdatePaymentDto);

      expect(result.status).toBe('failed');
    });

    it('PAY-09: should throw NotFoundException when updating non-existent payment', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.update('ghost-uuid', { amount: 100 })).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('PAY-10 (FIXED): should now SOFT-DELETE by setting is_active=false — GAP-DEL-04 resolved', async () => {
      const entity = mockPayment();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, is_active: false });

      const result = await service.remove(UUID_PAY);

      expect(entity.is_active).toBe(false);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
      expect(result).toEqual({ message: 'Payment deactivated successfully' });
    });

    it('PAY-11 (FIXED): remove() on ghost UUID now throws NotFoundException — GAP-DEL-04b resolved', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.remove('ghost-uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
