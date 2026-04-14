---
phase: 08-security-hardening
plan: 01
task: 03
type: security-checklist
date: 2026-04-12
---

# Production Security Checklist: Phase 08-01

## Status: PENDING - Waiting for Task 2 Completion

---

## RLS Status

- [ ] **RLS enabled on products table**
  - Verification: Supabase Dashboard → Authentication → Policies → products
  - Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE) marked "Active"
  - Status: PENDING

- [ ] **RLS enabled on orders table**
  - Verification: Supabase Dashboard → Authentication → Policies → orders
  - Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE) marked "Active"
  - Status: PENDING

- [ ] **RLS enabled on settlements table**
  - Verification: Supabase Dashboard → Authentication → Policies → settlements
  - Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE) marked "Active"
  - Status: PENDING

- [ ] **RLS enabled on deleted_records_history table**
  - Verification: Supabase Dashboard → Authentication → Policies → deleted_records_history
  - Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE) marked "Active"
  - Status: PENDING

- [ ] **RLS enabled on audit_logs table**
  - Verification: Supabase Dashboard → Authentication → Policies → audit_logs
  - Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE) marked "Active"
  - Note: DELETE policy intentionally blocks all deletes (immutable audit trail)
  - Status: PENDING

- [ ] **RLS enabled on vendor_settings table (if exists)**
  - Verification: Supabase Dashboard → Authentication → Policies → vendor_settings
  - Expected: RLS enabled, policies present
  - Status: PENDING

---

## Foundation Tables

- [ ] **user_profiles table created**
  - Columns: id, user_id, vendor_id, role, created_at, updated_at
  - Constraints: UNIQUE(user_id, vendor_id)
  - Purpose: Maps Supabase auth.users to business vendors for RLS enforcement
  - Status: PENDING

- [ ] **audit_logs table created**
  - Columns: id, vendor_id, operation_type, entity_type, record_id, record_count, user_id, timestamp, metadata, status
  - Indexes: vendor_id, timestamp, operation_type, user_id
  - Purpose: Compliance audit trail for all vendor operations
  - Status: PENDING

---

## Application Layer (Defense-in-Depth)

- [ ] **All queries include vendor_id filtering in code**
  - Location: src/lib/queries.ts, src/lib/bulk-operations.ts
  - Verification: No queries without vendor_id WHERE clause
  - Note: Redundant with RLS but acts as defense-in-depth
  - Status: VERIFY

- [ ] **Edge functions verify auth token before querying**
  - Location: supabase/functions/*/index.ts
  - Verification: All functions extract auth header → verify token → extract vendor_id
  - Examples:
    - bulk-update: Extracts vendor_id from user_profiles via auth.uid()
    - bulk-delete: Requires valid auth token
    - export-deleted-records: Vendor-scoped via auth
    - fetch-audit-logs: Vendor-scoped via auth
  - Status: VERIFY

- [ ] **No hardcoded vendor_id in queries**
  - Verification: Search codebase for hardcoded UUIDs in WHERE clauses
  - Command: `grep -r "vendor_id = '[a-f0-9-]" src/`
  - Status: VERIFY

---

## Secrets & Environment

- [ ] **SUPABASE_SERVICE_ROLE_KEY in environment variables only**
  - Verification: Not in source code, not in .git history
  - Location: .env.local or deployment secrets
  - Confirm: `grep -r "SUPABASE_SERVICE_ROLE_KEY" src/` returns nothing
  - Status: VERIFY

- [ ] **No API keys exposed in logs or error messages**
  - Verification: Error handlers don't leak auth headers or tokens
  - Check: Browser dev console → Network → Headers (no auth exposed)
  - Status: VERIFY

- [ ] **All edge functions use environment variable keys**
  - Verification: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from env
  - Status: VERIFY

---

## Testing & Build Verification

- [ ] **Build passes without errors**
  - Command: `npm run build`
  - Expected: ✓ Success (3738 modules, no TypeScript errors)
  - Status: PENDING

- [ ] **Build passes without warnings**
  - Command: `npm run build 2>&1 | grep -i warning`
  - Expected: No security-related warnings
  - Status: PENDING

- [ ] **E2E tests pass (if implemented)**
  - Command: `npm run test:e2e` (if exists)
  - Expected: ✓ All critical flows pass
  - Note: If no E2E tests exist, defer to Phase 4
  - Status: PENDING

- [ ] **No console.log statements in production code**
  - Command: `grep -r "console.log" src/ | grep -v "\.test\|\.spec"`
  - Expected: No matches (use proper logging instead)
  - Status: VERIFY

- [ ] **No hardcoded secrets in any file**
  - Command: `grep -r "sk-\|sk_\|password\|secret\|key" src/ --include="*.ts" --include="*.tsx" | grep -v "// \|comment"`
  - Expected: No hardcoded credentials
  - Status: VERIFY

---

## Multi-Tenant Isolation

- [ ] **RLS enforced at database layer (primary protection)**
  - Evidence: Test results from Task 2 (all TC pass)
  - Verification: Vendor A cannot see Vendor B data, period
  - Status: PENDING

- [ ] **Application-layer filtering still present (defense-in-depth)**
  - Evidence: All queries checked in "Application Layer" section above
  - Verification: Every query has vendor_id filtering
  - Status: PENDING

- [ ] **Multi-vendor isolation tested and verified**
  - Evidence: Task 2 test cases (TC-1 through TC-5) all PASS
  - Status: PENDING

---

## Documentation

- [ ] **RLS architecture documented**
  - Location: This checklist + enable_rls_policies.sql comments + code comments
  - Details:
    - Each policy documented with purpose
    - Service role bypass documented as intentional
    - Defense-in-depth strategy explained
  - Status: PENDING

- [ ] **Production deployment guide reviewed**
  - Location: README.md or DEPLOYMENT.md (to be created)
  - Includes:
    - RLS migration step
    - Environment variable setup
    - Post-deployment verification
  - Status: PENDING

---

## Production Readiness Sign-Off

### Prerequisites for Deployment
- [ ] All RLS policies active in Supabase
- [ ] Multi-vendor isolation verified (Task 2 PASS)
- [ ] Build passing with no warnings
- [ ] No exposed secrets or credentials
- [ ] Application-layer filtering as backup present
- [ ] Service role bypass intentional and documented

### Sign-Off
Once all boxes above are checked:

**Status:** ✓ READY FOR PRODUCTION

**Last Verified:** [User fills in date/time after completing all checks]

**Verified By:** [User name]

**Notes:** [Any issues or deferred items]

---

## Deferred Items (Phase 4+)

- [ ] MFA enforcement (security enhancement)
- [ ] Role-based audit log access (additional granularity)
- [ ] Advanced threat detection (future enhancement)
- [ ] Penetration testing (pre-GA requirement)

---

## Timeline

**Phase 08-01 RLS Completion Target:** 2026-04-12 (TODAY)

**Production Deployment Window:** 2026-04-13 to 2026-04-16 (3-5 days)

---

*Checklist to be completed after Task 2 verification*
