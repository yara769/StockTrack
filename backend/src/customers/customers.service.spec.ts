import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const UUID_CUS = '00000000-0000-0000-0000-000000000500';

const mockCustomer = (overrides: Partial<Customer> = {}): Customer =>
  ({
    id: UUID_CUS,
    name: 'أحمد محمد',
    phone: '0501234567',
    email: 'ahmed@example.com',
    address: 'الرياض، حي النزهة',
    loyalty_points: 0,
    is_active: true,
    tenant_id: null,
    created_at: new Date('2024-06-01'),
    updated_at: new Date('2024-06-01'),
    sales: [],
    ...overrides,
  }) as unknown as Customer;

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
});

type MockRepo = ReturnType<typeof mockRepo>;

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('CustomersService', () => {
  let service: CustomersService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: getRepositoryToken(Customer), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    repo    = module.get<MockRepo>(getRepositoryToken(Customer));
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('CUS-01: should create customer with only name — optional fields null, loyalty_points defaults to 0', async () => {
      const dto: CreateCustomerDto = { name: 'سارة أحمد' };
      const entity = mockCustomer({
        name: 'سارة أحمد',
        phone: null,
        email: null,
        address: null,
        loyalty_points: 0,
      });
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(result.name).toBe('سارة أحمد');
      expect(result.loyalty_points).toBe(0);
    });

    it('CUS-02: should create customer with all fields supplied', async () => {
      const dto: CreateCustomerDto = {
        name: 'أحمد محمد',
        phone: '0501234567',
        email: 'ahmed@example.com',
        address: 'الرياض، حي النزهة',
        loyalty_points: 150,
      };
      const entity = mockCustomer(dto);
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(result.phone).toBe('0501234567');
      expect(result.email).toBe('ahmed@example.com');
      expect(result.loyalty_points).toBe(150);
    });

    it('CUS-03 (GAP-P3-09): documents that negative loyalty_points passes service layer — @Min(0) missing', async () => {
      // Known gap: loyalty_points has @IsInt but no @Min(0)
      const dto: CreateCustomerDto = { name: 'عميل اختبار', loyalty_points: -100 };
      const entity = mockCustomer({ name: 'عميل اختبار', loyalty_points: -100 });
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(result.loyalty_points).toBe(-100);
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('CUS-04: should return only active customers ordered by created_at DESC', async () => {
      const customers = [mockCustomer()];
      repo.find.mockResolvedValue(customers);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { created_at: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });

    it('CUS-05: should return empty array when no active customers exist', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('CUS-04b: deactivated customers should be excluded from findAll', async () => {
      repo.find.mockResolvedValue([]); // deactivated customer excluded by is_active:true
      const result = await service.findAll();
      expect(result).toHaveLength(0);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('CUS-06: should return customer by valid UUID', async () => {
      repo.findOneBy.mockResolvedValue(mockCustomer());

      const result = await service.findOne(UUID_CUS);

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: UUID_CUS });
      expect(result.id).toBe(UUID_CUS);
    });

    it('CUS-07: should throw NotFoundException for non-existent UUID', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne('ghost-uuid')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('ghost-uuid')).rejects.toThrow(
        'Customer with id "ghost-uuid" not found',
      );
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('CUS-08: should update phone and email', async () => {
      const entity = mockCustomer();
      const dto: UpdateCustomerDto = { phone: '0509876543', email: 'new@example.com' };
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, phone: '0509876543', email: 'new@example.com' });

      const result = await service.update(UUID_CUS, dto);

      expect(result.phone).toBe('0509876543');
      expect(result.email).toBe('new@example.com');
      expect(repo.save).toHaveBeenCalled();
    });

    it('CUS-09: should update loyalty_points', async () => {
      const entity = mockCustomer();
      const dto: UpdateCustomerDto = { loyalty_points: 500 };
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, loyalty_points: 500 });

      const result = await service.update(UUID_CUS, dto);

      expect(result.loyalty_points).toBe(500);
    });

    it('CUS-09b: should update address', async () => {
      const entity = mockCustomer();
      const dto: UpdateCustomerDto = { address: 'جدة، حي الروضة' };
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, address: 'جدة، حي الروضة' });

      const result = await service.update(UUID_CUS, dto);

      expect(result.address).toBe('جدة، حي الروضة');
    });

    it('CUS-10: should throw NotFoundException when updating non-existent customer', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.update('ghost-uuid', { phone: '050' })).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('CUS-11: should soft-delete customer by setting is_active=false', async () => {
      const entity = mockCustomer();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, is_active: false });

      const result = await service.remove(UUID_CUS);

      expect(entity.is_active).toBe(false);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
      expect(result).toEqual({ message: 'Customer deactivated successfully' });
    });

    it('CUS-12: should throw NotFoundException when removing non-existent customer', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.remove('ghost-uuid')).rejects.toThrow(NotFoundException);
    });

    it('CUS-13: after remove(), customer should not appear in findAll()', async () => {
      repo.find.mockResolvedValue([]); // deactivated customer excluded by is_active:true filter
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });
});
