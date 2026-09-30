# Gaps & Edge Cases Report
## Inventory Management System — Backend Services

**Generated after:** 13 test suites / 163 unit tests — all passing  
**Scope:** All NestJS service modules across 3 test phases  

---

## Summary Scoreboard

| Category | Count | Severity |
|---|---|---|
| Security vulnerabilities | 2 | 🔴 Critical |
| Missing input validation (numeric) | 7 | 🔴 High |
| Missing enum guards | 5 | 🟡 Medium |
| Delete strategy inconsistencies | 4 | 🟡 Medium |
| Filter/query inconsistencies | 4 | 🟡 Medium |
| Missing server-side calculations | 3 | 🟡 Medium |
| Missing uniqueness constraints | 1 | 🟠 High |
| Missing FK integrity checks | 1 | 🟠 High |
| **Total gaps** | **27** | |

---

## 🔴 CRITICAL — Security

### GAP-SEC-01 · PIN stored as plain text
**Module:** `employees`  
**File:** `employees.service.ts` → `create()` / `update()`  
**Description:** The `pin` field is stored directly in the database as a plain string with no hashing. Any database breach exposes all employee PINs.  
**Test documenting this:** EMP-04  
**Fix:**
```typescript
// Before saving, hash the PIN:
import * as bcrypt from 'bcrypt';
if (dto.pin) {
  entity.pin = await bcrypt.hash(dto.pin, 10);
}
```

### GAP-SEC-02 · No authentication or authorization layer
**Modules:** All 13 modules  
**Description:** Zero `@UseGuards()` decorators exist on any controller or route. Every endpoint is fully public — no JWT, no role check, no session. The frontend has no login page either.  
**Risk:** Full CRUD access to all data without any identity verification.  
**Fix:** Implement a JWT auth guard + `@Roles()` decorator strategy before any production deployment.

---

## 🔴 HIGH — Missing Input Validation (Numeric Fields)

### GAP-VAL-01 · Negative `quantity` allowed in Inventory
**Module:** `inventory` · **DTO:** `CreateInventoryDto`  
**Test:** INV-03  
**Fix:** Add `@Min(0)` to `quantity` field.

### GAP-VAL-02 · Negative `min_stock` allowed in Inventory
**Module:** `inventory` · **DTO:** `CreateInventoryDto`  
**Test:** INV-04  
**Fix:** Add `@Min(0)` to `min_stock` field.

### GAP-VAL-03 · Zero or negative `qty` allowed in PO Items
**Module:** `po-items` · **DTO:** `CreatePoItemDto`  
**Test:** POI-03  
**Fix:** Add `@Min(1)` to `qty` field.

### GAP-VAL-04 · Negative `unit_cost` allowed in PO Items
**Module:** `po-items` · **DTO:** `CreatePoItemDto`  
**Test:** POI-04  
**Fix:** Add `@Min(0)` to `unit_cost` field.

### GAP-VAL-05 · Zero or negative `qty` allowed in Sale Items
**Module:** `sale-items` · **DTO:** `CreateSaleItemDto`  
**Test:** SI-03, SI-04  
**Fix:** Add `@Min(1)` to `qty` field.

### GAP-VAL-06 · Negative `amount` allowed in Payments
**Module:** `payments` · **DTO:** `CreatePaymentDto`  
**Test:** PAY-03  
**Fix:** Add `@Min(0)` to `amount` field.

### GAP-VAL-07 · Negative `refund_amount` allowed in Returns
**Module:** `returns` · **DTO:** `CreateReturnDto`  
**Test:** RET-03  
**Fix:** Add `@Min(0)` to `refund_amount` field.

### GAP-VAL-08 · Negative `loyalty_points` allowed in Customers
**Module:** `customers` · **DTO:** `CreateCustomerDto`  
**Test:** CUS-03  
**Fix:** Add `@Min(0)` to `loyalty_points` field.

### GAP-VAL-09 · Negative `total`/`subtotal`/`tax`/`discount` allowed in Sales
**Module:** `sales` · **DTO:** `CreateSaleDto`  
**Test:** SAL-05  
**Fix:** Add `@Min(0)` to all four financial fields.

---

## 🟠 HIGH — Missing Uniqueness & FK Integrity

### GAP-INT-01 · Duplicate Inventory rows for same store+product
**Module:** `inventory`  
**Description:** Nothing prevents two `Inventory` records with the same `store_id` + `product_id` combination. Stock levels would split across duplicate rows and produce incorrect counts.  
**Fix:** Add a composite unique constraint to the entity:
```typescript
@Entity('inventory')
@Unique(['store_id', 'product_id'])  // add this
export class Inventory extends BaseEntity { ... }
```

### GAP-INT-02 · Return `sale_id` not validated against active sales
**Module:** `returns`  
**Description:** `ReturnsService.create()` accepts any `sale_id` UUID without checking whether the referenced Sale exists or is active. A return can be created against a deleted or non-existent sale.  
**Fix:**
```typescript
async create(dto: CreateReturnDto): Promise<Return> {
  const sale = await this.saleRepo.findOneBy({ id: dto.sale_id, is_active: true });
  if (!sale) throw new NotFoundException(`Sale "${dto.sale_id}" not found or inactive`);
  // ...
}
```

---

## 🟡 MEDIUM — Missing Enum Guards (Free-form Strings)

### GAP-ENUM-01 · `PurchaseOrder.status` — no enum validation
**Test:** PO-03  
**Allowed values should be:** `pending`, `received`  
**Fix:** Add `@IsIn(['pending', 'received'])` to `CreatePurchaseOrderDto.status`

### GAP-ENUM-02 · `Sale.status` — no enum validation
**Test:** SAL-04  
**Allowed values should be:** `completed`, `refunded`, `void`  
**Fix:** Add `@IsIn(['completed', 'refunded', 'void'])` to `CreateSaleDto.status`

### GAP-ENUM-03 · `Return.status` — no enum validation
**Test:** RET-04  
**Allowed values should be:** `pending`, `approved`, `rejected`, `completed`  
**Fix:** Add `@IsIn(['pending', 'approved', 'rejected', 'completed'])` to `CreateReturnDto.status`

### GAP-ENUM-04 · `Payment.method` — no enum validation
**Test:** PAY-04  
**Allowed values should be:** `cash`, `card`, `transfer`  
**Fix:** Add `@IsIn(['cash', 'card', 'transfer'])` to `CreatePaymentDto.method`

### GAP-ENUM-05 · `Employee.role` — no enum validation
**Test:** EMP-03  
**Allowed values should be:** `cashier`, `manager`, `admin`  
**Fix:** Add `@IsIn(['cashier', 'manager', 'admin'])` to `CreateEmployeeDto.role`

---

## 🟡 MEDIUM — Delete Strategy Inconsistencies

| Module | Strategy | Expected | Test |
|---|---|---|---|
| `inventory` | HARD DELETE (`repo.delete`) | Soft-delete like all other modules | INV-12 |
| `po-items` | HARD DELETE (`repo.delete`) | Soft-delete (parent PO uses soft-delete) | POI-10 |
| `sale-items` | HARD DELETE (`repo.delete`) | Soft-delete (parent Sale uses soft-delete) | SI-12 |
| `payments` | HARD DELETE (`repo.delete`) | Soft-delete (financial audit trail required) | PAY-10 |

**Additional issue:** `inventory`, `po-items`, and `payments` `remove()` call `repo.delete(id)` **without a pre-check** (`findOne()`), so deleting a ghost UUID silently returns a success message instead of throwing `NotFoundException`.

**Fix pattern for all four:**
```typescript
async remove(id: string): Promise<{ message: string }> {
  const entity = await this.findOne(id); // throws NotFoundException if missing
  entity.is_active = false;
  await this.repo.save(entity);
  return { message: '... deactivated successfully' };
}
```

---

## 🟡 MEDIUM — Filter/Query Inconsistencies

| Module | `findAll()` filter | Expected behavior | Test |
|---|---|---|---|
| `inventory` | None — returns ALL records | Should filter `is_active: true` | INV-05 |
| `po-items` | None — returns ALL records | Should filter `is_active: true` | POI-05 |
| `sale-items` | None — returns ALL records | Should filter `is_active: true` | SI-07 |
| `payments` | None — returns ALL records | Should filter `is_active: true` | PAY-05 |

**Additional:** All services use `findOneBy({ id })` without an `is_active: true` guard, meaning soft-deleted records can still be fetched by ID — inconsistency documented in tests INV-09, EMP-08b.

---

## 🟡 MEDIUM — Missing Server-Side Calculations

### GAP-CALC-01 · Sale financials are fully caller-supplied
**Module:** `sales`  
**Fields:** `subtotal`, `tax`, `discount`, `total`  
**Test:** SAL-05  
**Description:** The frontend (or any API consumer) can send any combination of financial values regardless of the actual line items. The server never verifies that `total = subtotal + tax - discount`.  

### GAP-CALC-02 · SaleItem `total` is caller-supplied
**Module:** `sale-items`  
**Test:** SI-06 (GAP-P3-06)  
**Description:** `total` should equal `qty × unit_price` — currently the caller supplies it and the server stores whatever value is sent.  

### GAP-CALC-03 · PO Item `total` is caller-supplied
**Module:** `po-items`  
**Test:** POI-04b (GAP-11)  
**Description:** Same issue — `total` should equal `qty × unit_cost` but no server-side computation exists.  

**Fix pattern (example for SaleItem):**
```typescript
async create(dto: CreateSaleItemDto): Promise<SaleItem> {
  const entity = this.repo.create(dto);
  entity.total = dto.qty * dto.unit_price; // server-side calculation
  return this.repo.save(entity);
}
```

---

## Low Priority / Informational

| ID | Module | Description |
|---|---|---|
| INFO-01 | All | `tenant_id` is never set by any frontend form — always `null`. Multi-tenancy not enforced. |
| INFO-02 | `sales` | `findAll()` orders by `sold_at DESC` instead of `created_at DESC` — inconsistent with all other modules but intentional. |
| INFO-03 | `products` | `price` column is `decimal(10,2)` but MySQL returns it as a `string` — the frontend type `Product.price` is typed as `string` in `lib/api/types.ts`. |
| INFO-04 | `app.module.ts` | `synchronize: true` is active — auto-syncs schema from entities on every startup. Must be replaced with migrations before production. |

---

## Recommended Fix Priority

```
1. GAP-SEC-01  Hash employee PINs                        [Before any user login]
2. GAP-SEC-02  Add JWT auth guard to all controllers      [Before production]
3. GAP-INT-01  Unique constraint on inventory(store+product)
4. GAP-INT-02  Validate Return.sale_id references active sale
5. GAP-VAL-01..09  Add @Min() decorators to all numeric DTOs
6. GAP-ENUM-01..05 Add @IsIn() enum guards to status/method/role fields
7. GAP-DEL-01..04  Standardise remove() to soft-delete + pre-check
8. GAP-FILTER-01..04 Add is_active:true filter to findAll() in 4 modules
9. GAP-CALC-01..03 Move total calculations to service layer
```

---

*Report generated by automated unit test analysis across 13 service modules — 163 test cases executed.*
