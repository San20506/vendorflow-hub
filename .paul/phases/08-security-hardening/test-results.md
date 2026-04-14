---
phase: 08-security-hardening
plan: 01
task: 02
type: test-results
date: 2026-04-12
---

# Task 2: Multi-Vendor Data Isolation Testing

## Status: PENDING RLS MIGRATION PUSH

Waiting for user to execute RLS migration in Supabase Dashboard.

---

## Test Plan

### Setup
Once RLS migration is applied in Supabase:

1. **Verify RLS is enabled:**
   - Go to Supabase Dashboard → Authentication → Policies
   - Confirm all 20 RLS policies are listed as "Active"
   - Verify: products (4), orders (4), settlements (4), deleted_records_history (4), audit_logs (4)

2. **Verify foundation tables exist:**
   - Go to SQL Editor
   - Run: `SELECT COUNT(*) FROM user_profiles;`
   - Run: `SELECT COUNT(*) FROM audit_logs;`
   - Both should return 0 (tables created but empty until seeded)

3. **Create test vendors (if not already exist):**
   ```sql
   -- Check existing vendors
   SELECT vendor_id, name FROM vendors LIMIT 5;
   ```
   - If <2 vendors exist, create test data via app UI or seeding

### Test Cases

#### TC-1: Vendor A Data Isolation (SELECT)
- **Setup:** Login as Vendor A user
- **Action:** Navigate to Products page, query data
- **Expected:** Can see only Vendor A's products (2-N rows depending on existing data)
- **Verify:** Product IDs all belong to Vendor A's vendor_id
- **Result:** ✓ PASS / ✗ FAIL

#### TC-2: Vendor A Prevented from Seeing Vendor B (SELECT)
- **Setup:** Vendor B products are in database with different vendor_id
- **Action:** Logged in as Vendor A, try to manually query Vendor B's products via dev console
- **Query:** `SELECT * FROM products WHERE vendor_id = '<vendor_b_id>';`
- **Expected:** Returns 0 rows (RLS blocks access)
- **Result:** ✓ PASS / ✗ FAIL

#### TC-3: Vendor B Data Isolation (SELECT)
- **Setup:** Logout as Vendor A, login as Vendor B
- **Action:** Navigate to Products page
- **Expected:** Can see only Vendor B's products (different IDs than Vendor A)
- **Verify:** Cannot see any of Vendor A's product IDs
- **Result:** ✓ PASS / ✗ FAIL

#### TC-4: Vendor A Cannot Delete Vendor B Data
- **Setup:** Logged in as Vendor A
- **Action:** Try to delete Vendor B's order via edge function
  ```javascript
  const { count } = await supabase
    .from('orders')
    .delete()
    .eq('id', '<vendor_b_order_id>')
    .select('*', { count: 'exact' });
  ```
- **Expected:** count = 0 (RLS silently returns no rows to delete)
- **Result:** ✓ PASS / ✗ FAIL

#### TC-5: Edge Function Admin Bypass (Service Role Access)
- **Setup:** Call export-deleted-records edge function with service role
- **Action:** Verify it can see all vendors' data (no RLS filtering)
- **Expected:** Returns records from all vendors (admin sees everything)
- **Result:** ✓ PASS / ✗ FAIL

---

## Test Results

### Summary

| Test Case | Description | Status | Notes |
|-----------|-------------|--------|-------|
| TC-1 | Vendor A can see own products | PENDING | Waiting for RLS push |
| TC-2 | Vendor A blocked from Vendor B data | PENDING | Waiting for RLS push |
| TC-3 | Vendor B can see own products | PENDING | Waiting for RLS push |
| TC-4 | Vendor A cannot delete Vendor B data | PENDING | Waiting for RLS push |
| TC-5 | Service role bypass works (intentional) | PENDING | Waiting for RLS push |

### Acceptance Criteria (AC-2)
- [ ] All 5 test cases pass
- [ ] RLS blocks cross-vendor data access
- [ ] Service role bypass intentional and working
- [ ] No errors in browser console

---

## Next Steps

1. Execute RLS migration in Supabase Dashboard
2. Run test cases above
3. Document results in this file
4. Move to Task 3 (Security Checklist)

---

*Test results to be updated after RLS migration push*
