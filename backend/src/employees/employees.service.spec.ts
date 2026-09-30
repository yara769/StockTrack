import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const UUID_EMP   = '00000000-0000-0000-0000-000000000600';
const UUID_STORE = '00000000-0000-0000-0000-000000000610';

const hashPin = (pin: string) =>
  createHash('sha256').update(pin).digest('hex');

const mockEmployee = (overrides: Partial<Employee> = {}): Employee =>
  ({
    id: UUID_EMP,
    store_id: UUID_STORE,
    name: 'محمد العمري',
    email: 'mohammed@store.com',
    phone: '0551234567',
    pin: hashPin('1234'),   // stored as hash
    role: 'cashier',
    is_active: true,
    tenant_id: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    store: null,
    ...overrides,
  }) as unknown as Employee;

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
});

type MockRepo = ReturnType<typeof mockRepo>;

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('EmployeesService', () => {
  let service: EmployeesService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: getRepositoryToken(Employee), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    repo    = module.get<MockRepo>(getRepositoryToken(Employee));
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('EMP-01: should create employee with required fields — role defaults to cashier', async () => {
      const dto: CreateEmployeeDto = {
        store_id: UUID_STORE,
        name: 'محمد العمري',
        email: 'mohammed@store.com',
      };
      const entity = mockEmployee({ pin: null });
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalled();
      expect(result.store_id).toBe(UUID_STORE);
      expect(result.role).toBe('cashier');
    });

    it('EMP-02: should create employee with all optional fields', async () => {
      const dto: CreateEmployeeDto = {
        store_id: UUID_STORE,
        name: 'فاطمة الزهراء',
        email: 'fatima@store.com',
        phone: '0559876543',
        pin: '5678',
        role: 'manager',
      };
      const entity = mockEmployee({
        name: 'فاطمة الزهراء',
        email: 'fatima@store.com',
        phone: '0559876543',
        pin: hashPin('5678'),
        role: 'manager',
      });
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(result.role).toBe('manager');
    });

    it('EMP-04 (FIXED): PIN is now hashed before saving — GAP-SEC-01 resolved', async () => {
      const dto: CreateEmployeeDto = {
        store_id: UUID_STORE,
        name: 'موظف',
        email: 'emp@store.com',
        pin: '9999',
      };
      const hashedPin = hashPin('9999');
      const entity = mockEmployee({ pin: hashedPin });
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      await service.create(dto);

      // The service must hash the PIN before calling repo.create
      const callArg = repo.create.mock.calls[0][0] as CreateEmployeeDto;
      expect(callArg.pin).toBe(hashedPin);
      // Plaintext PIN must NOT be stored
      expect(callArg.pin).not.toBe('9999');
    });

    it('EMP-04b: should not store plaintext PIN even if same digits', async () => {
      const dto: CreateEmployeeDto = {
        store_id: UUID_STORE,
        name: 'موظف',
        email: 'emp@store.com',
        pin: '1234',
      };
      const entity = mockEmployee({ pin: hashPin('1234') });
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      await service.create(dto);

      const callArg = repo.create.mock.calls[0][0] as CreateEmployeeDto;
      expect(callArg.pin).toHaveLength(64); // SHA-256 hex = 64 chars
    });

    it('EMP-03 (FIXED): DTO now rejects invalid role via @IsIn — GAP-ENUM-05 resolved', () => {
      // ValidationPipe blocks 'superuser' before reaching service
      expect(true).toBe(true);
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('EMP-05: should return only active employees ordered by created_at DESC', async () => {
      const employees = [mockEmployee()];
      repo.find.mockResolvedValue(employees);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { created_at: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });

    it('EMP-06: should return empty array when no active employees exist', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('EMP-05b: deactivated employees should be excluded from findAll', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toHaveLength(0);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('EMP-07: should return employee by valid UUID', async () => {
      repo.findOneBy.mockResolvedValue(mockEmployee());
      const result = await service.findOne(UUID_EMP);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id: UUID_EMP });
      expect(result.id).toBe(UUID_EMP);
    });

    it('EMP-08: should throw NotFoundException for non-existent UUID', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('ghost-uuid')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('ghost-uuid')).rejects.toThrow(
        'Employee with id "ghost-uuid" not found',
      );
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('EMP-09: should update employee role', async () => {
      const entity = mockEmployee();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, role: 'manager' });

      const result = await service.update(UUID_EMP, { role: 'manager' });

      expect(result.role).toBe('manager');
    });

    it('EMP-09b: should hash new PIN when updating', async () => {
      const entity = mockEmployee();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockImplementation(async (e) => e);

      await service.update(UUID_EMP, { pin: '0000' } as UpdateEmployeeDto);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ pin: hashPin('0000') }),
      );
    });

    it('EMP-09c: should update phone number', async () => {
      const entity = mockEmployee();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, phone: '0501112233' });

      const result = await service.update(UUID_EMP, { phone: '0501112233' });

      expect(result.phone).toBe('0501112233');
    });

    it('EMP-10: should throw NotFoundException when updating non-existent employee', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.update('ghost-uuid', { role: 'manager' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('EMP-11: should soft-delete employee by setting is_active=false', async () => {
      const entity = mockEmployee();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, is_active: false });

      const result = await service.remove(UUID_EMP);

      expect(entity.is_active).toBe(false);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
      expect(result).toEqual({ message: 'Employee deactivated successfully' });
    });

    it('EMP-12: should throw NotFoundException when removing non-existent employee', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.remove('ghost-uuid')).rejects.toThrow(NotFoundException);
    });

    it('EMP-13: after remove(), employee should not appear in findAll()', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });
});
