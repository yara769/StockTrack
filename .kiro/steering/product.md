# Product Overview

This is a **multi-store Point-of-Sale (POS) and retail management system**. It covers the full retail operations lifecycle across multiple store locations.

## Core Domain Capabilities

- **Product catalog** — products organized into hierarchical (self-referencing) categories, identified by SKU and barcode
- **Inventory management** — per-store stock levels with min/max thresholds and bin/shelf location tracking
- **Procurement** — supplier management and purchase orders (POs) with line items; PO status flows from pending → received
- **Sales transactions** — sales with line items, subtotal/tax/discount/total calculations, cashier and customer association
- **Payments** — multiple payment records per sale (cash, card, etc.); tracks partial and full payment status
- **Returns** — return requests linked to a sale; tracks refund amounts and return status
- **Customer management** — customer records with loyalty points
- **Employee management** — staff records with store assignment and role/PIN support
- **Multi-tenancy scaffolding** — every entity carries a `tenant_id` for future SaaS isolation (not yet enforced in queries)

## Current State

The backend API is functional with CRUD endpoints for all modules. The frontend (`frontend/`) is a bare Next.js scaffold — no custom UI has been built yet.
