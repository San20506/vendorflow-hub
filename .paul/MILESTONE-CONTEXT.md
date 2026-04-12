# Milestone Context

**Generated:** 2026-04-12
**Status:** Ready for /paul:milestone

## Features to Build

### 1. Bulk Data Import with Auto-Detection
- Drag & drop file upload (CSV, JSON, JSONL, XLSX)
- Auto-detect file format and schema
- Preprocessing pipeline to normalize data against Supabase schema
- Field name humanization (customer_id → "customer id")
- Gemini-powered error fixing (96%+ confidence only)
- Dev flagging + structured logging for errors

### 2. Import Metrics & User Feedback
- Vendor-friendly success summary (X records imported, Y skipped)
- No technical error details shown to vendor
- Import failure screen with "Try again later" message
- Dev dashboard showing detailed logs + failed records

### 3. Multi-Entity Support
- Auto-detect what entities are in the file (products, orders, settlements, etc.)
- Smart mapping without vendor configuration
- Unified import (one file, multiple entity types)
- Per-entity validation and success reporting
- "Missing required column" warnings (e.g., "customer id missing for 15 orders")

## Scope

**Suggested name:** v0.2 Data Management & Extensions
**Estimated phases:** 2-3
**Focus:** Bootstrap vendor data, enable bulk operations, establish data pipeline

## Phase Mapping

| Phase | Focus | Features |
|-------|-------|----------|
| 1 | Data Import Pipeline | Bulk upload, auto-detect, preprocessing, metrics |
| 2 | (Optional) Bulk Updates | Correct/modify existing data in bulk |
| 3 | (Optional) Data Export | Export vendor data for backup/audit |

## Constraints

- Use existing Supabase schema (no migrations for this phase)
- All user input validation at boundary
- Gemini API for confidence-based auto-fixing only
- Dev flagging on errors >4% failure rate
- Human-readable field names in all UI output
- No preview step (commit immediately if Gemini confidence ≥96%)

## Additional Context

- Client-driven feature request (real vendor need)
- Aligns with core goal: vendors manage their data
- Safety net: Gemini fixing + dev flagging prevents data loss
- Vendor experience priority: no technical jargon

---

*This file is temporary. It will be deleted after /paul:milestone creates the milestone.*
