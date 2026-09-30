# Project Structure

## Repository Layout

```
market/
├── src/                    # NestJS backend
├── frontend/               # Next.js frontend (bare scaffold)
├── dist/                   # Compiled backend output (gitignored)
├── .env                    # Environment variables (DB credentials, PORT)
├── nest-cli.json           # NestJS CLI config
├── package.json            # Backend dependencies and scripts
└── tsconfig.json           # Backend TypeScript config
```

---

## Backend — `src/`

```
src/
├── main.ts                         # App bootstrap (ValidationPipe, /api/v1 prefix)
├── app.module.ts                   # Root module — registers TypeORM and all feature modules
├── common/
│   └── entities/
│       └── baseEntity.ts           # Abstract base entity (see below)
├── stores/                         # Store locations
├── employees/                      # Staff and cashiers
├── categories/                     # Self-referencing product category tree
├── products/                       # Product catalog (SKU, barcode, price, unit)
├── inventory/                      # Per-store stock levels
├── suppliers/                      # Supplier records
├── purchase-orders/                # POs from suppliers
├── po-items/                       # Line items on a purchase order
├── customers/                      # Customer records with loyalty points
├── sales/                          # Sales transactions
├── sale-items/                     # Line items on a sale
├── payments/                       # Payments against a sale
└── returns/                        # Return requests against a sale
```

### Feature Module Convention

Every feature module follows this identical structure:

```
<module>/
├── <module>.module.ts
├── <module>.controller.ts
├── <module>.service.ts
├── dto/
│   ├── create-<module>.dto.ts
│   └── update-<module>.dto.ts
└── entities/
    └── <module>.entity.ts
```

Controllers handle HTTP routing only. Services own all business logic. DTOs handle input validation via `class-validator` decorators.

### BaseEntity

All entities extend `src/common/entities/baseEntity.ts`, which provides:

- `id` — UUID primary key (`PrimaryGeneratedColumn('uuid')`)
- `tenant_id` — multi-tenancy hook (`varchar(36)`, nullable, not yet query-enforced)
- `is_active` — soft-delete flag (`boolean`, default `true`)
- `created_at` / `updated_at` — auto-managed timestamps

### Entity Relationships

```
Store ──< Employee
Store ──< Inventory >── Product >── Category (self-ref tree)
Store ──< PurchaseOrder >── Supplier
PurchaseOrder ──< PoItem >── Product
Store ──< Sale
Customer ──< Sale
Employee (cashier) ──< Sale
Sale ──< SaleItem >── Product
Sale ──< Payment
Sale ──< Return
```

Relationships are declared with `@ManyToOne` / `@OneToMany` / `@JoinColumn`. Every FK is also stored as an explicit shadow column (e.g., `store_id`, `cust_id`, `emp_id`) for direct query access without loading the relation.

---

## Frontend — `frontend/`

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page (default scaffold only)
│   └── globals.css         # Tailwind base styles
├── public/                 # Static assets
├── next.config.ts
└── package.json
```

Next.js App Router is used. The frontend is currently a blank scaffold — no custom pages or API integration exist yet. New pages go under `frontend/app/` following App Router conventions.

---

## Conventions

- All IDs are UUIDs. Use `ParseUUIDPipe` when binding route params to entity ids.
- Snake_case for DB column names; camelCase for TypeScript properties and methods.
- Soft deletes are implemented on some modules via `is_active = false`. Check the service before reaching for `repo.delete`.
- `tenant_id` must be propagated when creating any entity. Query filtering by `tenant_id` is not yet implemented but should be added before multi-tenant production use.
- Do not add logic to controllers — keep them thin HTTP adapters. All business rules belong in services.
