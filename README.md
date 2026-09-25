# H&H — Personal E-Commerce Brand Platform

[![CI/CD Pipeline](https://github.com/devnadeemashraf/handh/actions/workflows/ci.yml/badge.svg)](https://github.com/devnadeemashraf/handh/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-0.38-C5F74F.svg)](https://orm.drizzle.team/)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D.svg)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Async%20Worker-orange.svg)](https://bullmq.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-316%20Passing-brightgreen.svg)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **H&H** is a modern personal e-commerce brand platform designed for high-concurrency commerce. It bridges refined modest wear (abayas, kurtis, slip-ons, veils), bespoke menswear (raw silk shirts, oversized tees, joggers), tech accessories (phone cases, tempered glass), and on-demand custom printing.

---

## 🌟 Promising Features Worth Praising

### 1. Multi-Vertical Dynamic Catalog & Materialized Paths

- **5 Enterprise Departments & 60+ Categories:** Covers _Men's Heritage_, _Women's Modest_, _Tech Protection_, _On-Demand Custom Print_, and _Accessories_.
- **Materialized Path Hierarchy:** Categories store structured paths (`/men/apparel/t-shirts`, `/tech/cases/iphone-16-pro`) enabling $O(1)$ subtree queries with indexable prefix matches (`LIKE '/men%'`).
- **Dynamic Spec Registry:** Resolves dynamic attributes (GSM, fabric, fit, phone model, finish) into frontend facet filters without database schema modifications.

### 2. On-Demand Custom Printing & Special Orders Governance

- **Admin-Controlled Customization Rules:** Configure which products can be customized, set custom text character limits, require artwork image uploads, and apply custom surcharges.
- **Storage Engine with Magic-Byte Inspection:** Strategy Pattern file storage (`LocalStorageAdapter` & `S3StorageAdapter`) that validates file headers against spoofed extensions for PNG, JPEG, WebP, SVG, and PDF.

### 3. Concurrency-Safe Atomic Checkout

- **Zero Overselling Guarantee:** Prevents race conditions during flash drops using PostgreSQL transactional `SELECT ... FOR UPDATE` row-level locks on stock inventory records.
- **15-Minute Reservation Windows:** Unpaid carts automatically release inventory reservations via atomic state timers.
- **Razorpay India Payment Gateway:** Client-side gateway modal integration with HMAC-SHA256 signature verification and idempotent webhook reconciliation.

### 4. Background Notification Worker Engine

- **BullMQ & Redis Message Broker:** Offloads time-consuming tasks from the web server.
- **VIP WhatsApp Concierge:** Dispatches formatted customer order confirmations and admin notifications via WhatsApp Cloud API.
- **Branded HTML Emails:** Multi-recipient transactional notifications via Resend/SMTP.

### 5. Stealth Admin Operations Center

- **Invisible Admin Gateway:** Unauthenticated requests to `/admin` without the secret gateway key receive a **fake HTTP 404 (Not Found)**.
- **Thermal Packing Slips & GST Invoices:** One-click 4×6 thermal packing slips and compliant GST tax invoices.
- **Multi-Carrier Fulfillment:** Integrated courier dispatch for India Post, DTDC, and Delhivery.
- **Executive Intelligence & Instagram Attribution:** Real-time gross revenue, AOV, patron repeat rates, and Instagram bio-link/reel traffic attribution.
- **Storefront Killswitch:** Granular service controls to toggle checkout maintenance or pause payment gateways in real time.

### 6. Observability, Security & Resilience

- **Multi-Service Health Probe (`/api/health`):** Verifies PostgreSQL `SELECT 1`, Redis ping latency, memory consumption, and process uptime.
- **Redis Sliding-Window Rate Limiting:** Defends OTP verification, admin authentication, and checkout submission against brute-force attacks.
- **Strict Security Headers:** Out-of-the-box HSTS, CSP, X-Frame-Options (`DENY`), and X-Content-Type-Options (`nosniff`).
- **PWA & Mobile-First:** Installable Progressive Web App with offline service worker support and mobile safe-area navigation.
- **Zero Inline Styles:** 100% Tailwind CSS and Radix UI/shadcn primitives adhering to the Royale Emerald (`#0A2E24`), Royale Gold (`#C5A880`), and Warm Beige (`#FDFBF7`) design system.

---

## 🏗️ Architecture & Technical Approach

The project is structured as a **Clean Architecture Monorepo** powered by `pnpm` workspaces:

```
handh/
├── apps/
│   ├── web/               # Next.js 15 App Router storefront & admin portal
│   └── worker/            # BullMQ background async processor (Email, WhatsApp)
├── packages/
│   ├── domain/            # Pure TypeScript business logic, types, Zod schemas, errors
│   ├── db/                # Drizzle ORM schema, migrations, repositories, PostgreSQL client
│   └── config/            # Environment variable validation & shared configurations
├── docs/
│   └── api-reference.md   # Exhaustive backend API documentation
├── scripts/
│   ├── backup-db.sh       # Automated timestamped PostgreSQL backup with rotation
│   └── restore-db.sh      # Database restoration utility
├── Dockerfile.web         # Production multi-stage Dockerfile (Next.js standalone runner)
├── Dockerfile.worker      # Production multi-stage Dockerfile (BullMQ worker)
├── Caddyfile              # Caddy reverse proxy with automatic Let's Encrypt TLS
└── docker-compose.prod.yml# Production container orchestration
```

### Design Patterns Applied:

- **Strategy Pattern:** Used for Storage (`LocalStorageAdapter`, `S3StorageAdapter`), Analytics (`PostHogAnalyticsAdapter`, `ConsoleAnalyticsAdapter`), and Notifications (`ResendEmailAdapter`, `WhatsAppCloudAdapter`).
- **Repository Pattern:** Decouples database queries and Drizzle SQL operations from HTTP controllers.
- **Result / Domain Error Pattern:** Structured domain exceptions (`ConflictError`, `ValidationError`, `NotFoundError`) mapped cleanly to HTTP status codes.
- **Specification Registry Pattern:** Dynamic catalog facet extraction without altering core product models.

---

## 🚀 Getting Started Locally

### Prerequisites

- **Node.js:** `v22.0.0` or higher
- **pnpm:** `v9.0.0` or higher (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Docker & Docker Compose:** For running PostgreSQL and Redis

### Step 1: Clone the Repository

```bash
git clone https://github.com/devnadeemashraf/handh.git
cd handh
```

### Step 2: Install Workspace Dependencies

```bash
pnpm install
```

### Step 3: Start Local Infrastructure

```bash
# all services without floci
pnpm docker:up
```

OR

```bash
# all services with floci
pnpm docker:up:with-floci
```

This boots:

- **PostgreSQL 16:** Running on `localhost:5432` (database: `hh_dev`, user/pass: `postgres:postgres`)
- **Redis 7:** Running on `localhost:6379`

### Step 4: Configure Environment Variables

Create `.env.local` in `apps/web/`:

```bash
cp .env.example apps/web/.env.local
```

Key development defaults:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/hh_dev
REDIS_URL=redis://localhost:6379
ADMIN_ACCESS_KEY=hh_dev_access_key
ADMIN_PASSWORD=hh_dev_master_password
ADMIN_SESSION_SECRET=hh_dev_session_secret_32chars_min
AUTH_JWT_SECRET=hh_dev_jwt_secret_32chars_minimum
```

### Step 5: Run Database Migrations & Seed Catalog

```bash
# Push schema migrations
pnpm --filter @hh/db exec tsx src/migrate.ts

# Seed multi-vertical catalog (62 categories, 17 multi-vertical SKUs)
pnpm --filter @hh/db exec tsx src/seed.ts
```

### Step 6: Start Development Servers

```bash
# Runs Next.js web application and BullMQ worker concurrently
pnpm dev
```

- **Storefront:** Visit [`http://localhost:3000`](http://localhost:3000)
- **Stealth Admin Login:** Visit [`http://localhost:3000/admin/login?key=hh_dev_access_key`](http://localhost:3000/admin/login?key=hh_dev_access_key)
  - Gateway Key: `hh_dev_access_key`
  - Master Password: `hh_dev_master_password`
- **Health Probe:** Visit [`http://localhost:3000/api/health`](http://localhost:3000/api/health)

---

## 🧪 Testing & Code Quality

The codebase enforces 100% automated test coverage across domain logic, database repositories, workers, and React components:

```bash
# Run all 316 automated tests
pnpm test

# Run TypeScript typechecks across all 5 packages
pnpm typecheck

# Run ESLint validation
pnpm lint

# Build Next.js application in production standalone mode
pnpm --filter @hh/web build
```

---

## 🚢 Production Deployment

### Quick Deploy with Docker Compose & Caddy

1. Configure `.env.production` using the documented template:
   ```bash
   cp .env.production.example .env.production
   ```
2. Launch production stack with automatic HTTPS:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
   ```
3. Caddy will automatically provision Let's Encrypt SSL/TLS certificates for your configured domain.

### Automated Database Backups

```bash
# Run backup (creates timestamped gzip dump in ./backups/ and prunes >14 days)
./scripts/backup-db.sh

# Restore from backup
./scripts/restore-db.sh ./backups/hh_backup_20260920_034413.sql.gz
```

---

## 📚 API Reference

For detailed documentation on all backend REST endpoints, schemas, authentication headers, and code snippets, see the [API Reference Guide](docs/api-reference.md).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
