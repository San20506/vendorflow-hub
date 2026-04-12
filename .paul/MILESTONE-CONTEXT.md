# Milestone Context: Phase 07 — Bulk Data Operations

**Generated:** 2026-04-12
**Status:** Ready for /paul:milestone

## Features to Build

### 1. Bulk Edit
- Select multiple records (products, orders, settlements)
- Batch update field values (e.g., "Mark all orders status=shipped")
- Preview changes before commit
- Audit trail (who changed what, when)

### 2. Bulk Delete with 5-Level Rollback History
- Delete records with soft-delete + versioning
- Keep 5 rollback states per deleted entity (FIFO — newest swap oldest on 6th delete)
- Vendors can restore any previous state within the 5-version window
- Compliance: Full audit trail of deletions + restores
- Use case: Accidental mass deletion recovery, data correction loops

### 3. Bulk Categorize
- Auto-assign categories to records missing required fields
- Assign tags/metadata to groups of products
- Useful post-import: "100 products imported without category → bulk assign 'Uncategorized'"

### 4. Approval Workflow
- Flag records requiring review (e.g., imported records with unfixable errors)
- Vendor reviews and decides: approve / reject / edit
- Once approved, records commit to live tables
- Dev can see flagged records in admin dashboard

### 5. Rollback/History Management
- View deletion history (with timestamps, user, reason)
- Restore from any of the 5 rollback states
- Purge history if needed (with confirmation)

## Scope

**Suggested name:** v0.2.1 Bulk Data Operations & Safety
**Estimated phases:** 2
**Focus:** Bulk record management with built-in safety (rollback history, approval workflows, audit trails)

## Phase Mapping

| Phase | Focus | Features |
|-------|-------|----------|
| 07-01 | Bulk Edit & Categorize | Bulk edit UI, preview, commit. Bulk categorize. Audit logging. |
| 07-02 | Delete Safety & Approval | Soft-delete + 5-state rollback versioning. Approval workflow. History UI. |

## Constraints

- **Delete strategy:** Soft-delete (not hard delete) — records marked `deleted_at`, `is_deleted: true`
- **Versioning:** Store up to 5 JSON snapshots per deleted record in `deleted_records_history` table
- **Rollback limit:** 5 versions max per record (oldest auto-purged on new delete)
- **Audit:** All changes logged (edit, delete, restore) with user_id, timestamp, reason
- **Approval:** Required for imports with unfixable errors before live commit
- **No breaking changes:** Use existing Supabase schema (soft-delete only)

## Additional Context

- Builds on Phase 06-01 (import) — handles post-import corrections
- Defers RLS hardening to Phase 8 (security hardening pass)
- Pairs with Phase 08 (export + full audit trails) for compliance story
- Rollback history: 5 versions per record balances safety vs storage (typical use: 2-3 corrective edits)

---

*This file is temporary. It will be deleted after /paul:milestone creates the milestone.*
