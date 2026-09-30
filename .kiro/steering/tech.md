# Tech Stack

## Backend

| Layer | Technology |
|---|---|
| Framework | NestJS 11 |
| Language | TypeScript 5.7 |
| ORM | TypeORM 1.1 |
| Database | MySQL (driver: `mysql2` 3.x) |
| Validation | `class-validator` + `class-transformer` |
| Config | `@nestjs/config` — reads `.env` at repo root |
| HTTP adapter | Express (via `@nestjs/platform-express`) |

## Frontend

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 |
| Styling | Tailwind CSS 4 |
| Language | TypeScript 5 |

## Testing

| Tool | Purpose |
|---|---|
| Jest 30 | Unit tests (`.spec.ts` files in `src/`) |
| Supertest | HTTP integration tests |
| `@nestjs/testing` | Module testing utilities |
| ts-jest | TypeScript transform for Jest |

### Jest Commands

- **ALWAYS use `--testPathPatterns`** (plural) instead of the deprecated `--testPathPattern` (singular) flag. The singular form is removed in Jest 30 and will cause an unrecognized option error.

```bash
# ✅ Correct — run a subset of spec files
npx jest --testPathPatterns="sales\.service\.spec|payments\.service\.spec" --no-coverage

# ❌ Deprecated / broken in Jest 30
npx jest --testPathPattern="pattern" --no-coverage
```

## Code Quality

- **Prettier** — single quotes, trailing commas (`all`), config in `.prettierrc`
- **ESLint** — TypeScript-ESLint + `eslint-plugin-prettier`, config in `eslint.config.mjs`
- **Naming conventions**: `snake_case` for database column names and entity properties; `camelCase` for TypeScript class members and method names

---

## Common Commands

### Backend (run from repo root)

```bash
npm run start:dev     # Development server with hot reload (nest start --watch)
npm run start:prod    # Production server (node dist/main)
npm run build         # Compile to dist/ (nest build)
npm run lint          # ESLint with auto-fix
npm run format        # Prettier format src/ and test/
npm run test          # Run unit tests (jest)
npm run test:cov      # Run tests with coverage report
npm run test:e2e      # Run end-to-end tests (jest --config ./test/jest-e2e.json)
```

### Frontend (run from `frontend/`)

```bash
npm run dev      # Next.js development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

---

## Environment Variables

Defined in `.env` at the repo root. Required variables:

```
DB_HOST
DB_PORT
DB_USERNAME
DB_PASSWORD
DB_NAME
PORT          # Optional — defaults to 3000
```

---

## Important Notes

- **`synchronize: true`** is set in TypeORM config — the database schema is auto-synced from entities on every startup. This is acceptable for development but **must be replaced with migrations before any production deployment**.
- The global API prefix is `/api/v1`. All backend routes are served under this prefix.
- `ValidationPipe` is applied globally with `whitelist: true` and `transform: true` — unknown properties are stripped and payloads are automatically transformed to DTO class instances.
