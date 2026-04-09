# vendorflow-hub

## What This Is

A multi-channel e-commerce management platform for vendors. It syncs product inventory across e-commerce stores (Shopify, Amazon, etc.) in real-time and provides a dashboard with insights on product performance, sales analytics, reconciliation, orders, and financials across all connected stores.

## Core Value

Vendors can track and manage their product stock across multiple e-stores from a single online warehouse hub, with real-time sync and performance insights.

## Current State

| Attribute | Value |
|-----------|-------|
| Type | Application |
| Version | 0.2.0-alpha |
| Status | MVP (UI/UX polished, data wired to Supabase, ready for channel connectors) |
| Last Updated | 2026-04-10 |

## Requirements

### Core Features

- Multi-store inventory sync (real-time across e-commerce channels)
- Unified dashboard with KPIs and performance insights
- Orders and returns management across channels
- Financial reconciliation and settlements tracking
- AI-powered insights and chatbot for on-demand analysis

### Validated (Shipped)

- ✓ UI/UX polish and frontend fixes — Phase 1 (2026-04-09)
- ✓ Supabase schema with users, vendors, products, orders, settlements — Phase 2 Plan 01 (2026-04-09)
- ✓ Real backend integration: Dashboard, Orders, Insights wired to live Supabase queries — Phase 2 Plan 02 (2026-04-10)

### Active (In Progress)

- [ ] Live e-commerce channel connectors (Shopify, Amazon, etc.)

### Planned (Next)

- [ ] Live e-commerce channel connectors
- [ ] Row-level security (RLS) and multi-tenant hardening
- [ ] Pagination and performance optimization
- [ ] Real-time subscriptions (Supabase Realtime)
- [ ] AI agents for insights on demand
- [ ] Marketing funnel / lead management

### Out of Scope

- To be defined during /paul:plan

## Target Users

**Primary:** Vendors selling across multiple e-commerce platforms
- Managing inventory across 2+ stores
- Need consolidated view of stock, orders, financials
- Want actionable insights without manual data collation

## Constraints

### Technical Constraints

- React + Vite + TypeScript + Shadcn/ui (existing stack — do not change)
- Supabase for backend/auth
- TanStack Query for data fetching
- React Router for navigation
- Must work as PWA (vite-plugin-pwa configured)

### Business Constraints

- Phase 1 (UI/UX polish) complete as of 2026-04-09

## Key Decisions

| Decision | Rationale | Date | Status |
|----------|-----------|------|--------|
| Use existing Lovable codebase as foundation | Client requirement, half-built | 2026-04-07 | Active |
| React + Vite + Shadcn/ui | Lovable default stack | 2026-04-07 | Active |
| Phase 1: Migrate inline styles to Tailwind CSS | Consistency, maintainability, theme support | 2026-04-09 | ✓ Shipped |
| Phase 2: Use Supabase PostgreSQL with auto-generated types | Type safety, schema-first approach, minimal migration needed | 2026-04-09 | ✓ Shipped |
| Phase 2: Custom React hooks + TanStack Query for data | Encapsulation, caching, vendor-scoped data access | 2026-04-10 | ✓ Shipped |
| Defer RLS policies to Phase 4 | Focus on functionality first; security hardening after channel connectors | 2026-04-10 | Deferred |
| Defer pagination to Phase 3/4 | Current demo data volume manageable; add when scaling | 2026-04-10 | Deferred |

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| UI/UX client approval | Today | Complete | ✓ On track |
| Build passing | No errors | Passing | ✓ On track |

## Tech Stack / Tools

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React + Vite + TypeScript | Lovable scaffold |
| UI Components | Shadcn/ui + Radix UI | Full component library |
| Styling | Tailwind CSS | |
| Backend | Supabase | Auth + DB |
| Data Fetching | TanStack React Query | |
| Routing | React Router DOM | |
| Charts | Recharts | |
| PWA | vite-plugin-pwa | |

---
*PROJECT.md — Updated when requirements or context change*
*Last updated: 2026-04-09 after Phase 1 completion*
