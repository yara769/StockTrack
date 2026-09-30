import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const UUID_1 = '00000000-0000-0000-0000-000000000001';
const UUID_2 = '00000000-0000-0000-0000-000000000002';

const mockCategory = (overrides: Partial<Category> = {}): Category =>
  ({
    id: UUID_1,
    name: 'إلكترونيات',
    slug: 'electronics',
    description: 'أجهزة إلكترونية',
    sort_order: 0,
    parent_id: null,
    parent: null,
    children: [],
    products: [],
    is_active: true,
    tenant_id: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }) as Category;

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
});

type MockRepo = ReturnType<typeof mockRepo>;

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('CategoriesService', () => {
  let service: CategoriesService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repo = module.get<MockRepo>(getRepositoryToken(Category));
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('C-01: should create a root category (no parent)', async () => {
      const dto: CreateCategoryDto = { name: 'إلكترونيات', slug: 'electronics' };
      const entity = mockCategory();
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(result.parent_id).toBeNull();
    });

    it('C-02: should create a child category with valid parent_id', async () => {
      const dto: CreateCategoryDto = {
        name: 'هواتف',
        slug: 'phones',
        parent_id: UUID_2,
      };
      const entity = mockCategory({ name: 'هواتف', slug: 'phones', parent_id: UUID_2, id: UUID_1 });
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(result.parent_id).toBe(UUID_2);
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('C-08: should return active categories ordered by sort_order ASC', async () => {
      const cats = [
        mockCategory({ sort_order: 1 }),
        mockCategory({ sort_order: 2, id: UUID_2, slug: 'phones' }),
      ];
      repo.find.mockResolvedValue(cats);

      const result = await service.findAll();

      expect(repo.find).toHaveBeenCalledWith({
        where: { is_active: true },
        order: { sort_order: 'ASC' },
      });
      expect(result[0].sort_order).toBe(1);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('C-09: should return category by valid UUID', async () => {
      repo.findOneBy.mockResolvedValue(mockCategory());
      const result = await service.findOne(UUID_1);
      expect(result.id).toBe(UUID_1);
    });

    it('C-10: should throw NotFoundException for non-existent UUID', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('GAP-05: findOne returns soft-deleted category — known gap', async () => {
      repo.findOneBy.mockResolvedValue(mockCategory({ is_active: false }));
      const result = await service.findOne(UUID_1);
      expect(result.is_active).toBe(false); // should throw 404 after fix
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('C-11: should update parent_id of a category', async () => {
      const entity = mockCategory();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, parent_id: UUID_2 });

      const result = await service.update(UUID_1, { parent_id: UUID_2 });

      expect(result.parent_id).toBe(UUID_2);
    });

    it('should throw NotFoundException when updating non-existent category', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.update('bad-uuid', {})).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('C-12: should soft-delete category (is_active=false)', async () => {
      const entity = mockCategory();
      repo.findOneBy.mockResolvedValue(entity);
      repo.save.mockResolvedValue({ ...entity, is_active: false });

      const result = await service.remove(UUID_1);

      expect(entity.is_active).toBe(false);
      expect(result).toEqual({ message: 'Category deactivated successfully' });
    });

    it('C-13 (GAP-04): should soft-delete parent category even when it has active children — known gap', async () => {
      // Service does NOT check for children before soft-deleting
      const parent = mockCategory({
        children: [mockCategory({ id: UUID_2, slug: 'phones', parent_id: UUID_1 })],
      });
      repo.findOneBy.mockResolvedValue(parent);
      repo.save.mockResolvedValue({ ...parent, is_active: false });

      const result = await service.remove(UUID_1);

      // Documents current behavior — should be blocked or cascade after fix
      expect(result).toEqual({ message: 'Category deactivated successfully' });
    });

    it('should throw NotFoundException for non-existent category', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.remove('bad-uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
