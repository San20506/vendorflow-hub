#!/usr/bin/env python3
"""
Reset platform data and load only sample data (Amazon + Firstcry).
Run: python3 scripts/reset_and_load_sample.py
"""

import os
import sys
import csv
import zipfile
import tempfile
import shutil
from pathlib import Path
from datetime import datetime

try:
    import openpyxl
    from supabase import create_client, Client
except ImportError:
    print("Installing dependencies...")
    os.system(f"{sys.executable} -m pip install supabase openpyxl -q")
    import openpyxl
    from supabase import create_client, Client

# ─── Config ──────────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
SAMPLE_DIR = ROOT / "Data" / "extracted" / "Sample data"
AMAZON_ZIP = SAMPLE_DIR / "Amazon.zip"
FIRSTCRY_ZIP = SAMPLE_DIR / "Firstcry.zip"

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    env_path = ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            k, _, v = line.partition("=")
            v = v.strip().strip('"')
            if k == "SUPABASE_URL" and not SUPABASE_URL:
                SUPABASE_URL = v
            if k == "VITE_SUPABASE_URL" and not SUPABASE_URL:
                SUPABASE_URL = v
            if k == "SUPABASE_SERVICE_ROLE_KEY" and not SUPABASE_KEY:
                SUPABASE_KEY = v

print(f"Supabase URL: {SUPABASE_URL}")
print(f"Key: {SUPABASE_KEY[:30]}...")

# ─── Helpers ─────────────────────────────────────────────────────────────────

def clean_str(v):
    if v is None: return None
    s = str(v).strip().replace('"""', '').strip('"')
    return s if s and s != '-' and s != 'None' else None

def clean_num(v):
    if v is None: return None
    try: return float(str(v).replace(',', ''))
    except: return None

def clean_date(v):
    if v is None: return None
    s = str(v).strip()
    if not s or s == '-': return None
    for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"]:
        try:
            return datetime.strptime(s, fmt).isoformat()
        except: pass
    # Try with truncation for datetime strings
    for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d"]:
        try:
            return datetime.strptime(s[:19], fmt).isoformat()
        except: pass
    return None  # drop unparseable dates rather than sending invalid string

def xlsx_rows(path, sheet_name=None, header_row=0):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb[sheet_name] if sheet_name else wb.active
    rows = list(ws.iter_rows(values_only=True))
    wb.close()
    if not rows: return
    headers = [str(h) if h is not None else '' for h in rows[header_row]]
    for row in rows[header_row + 1:]:
        if all(v is None for v in row): continue
        yield headers, list(row)

def dedup(records: list, conflict: str) -> list:
    """Deduplicate records by conflict key columns before upsert."""
    keys = [k.strip() for k in conflict.split(",")]
    seen = {}
    for r in records:
        k = tuple(r.get(col) for col in keys)
        seen[k] = r  # last one wins
    return list(seen.values())

def batch_upsert(supabase: Client, table: str, records: list, conflict: str, batch_size=200):
    records = dedup(records, conflict)
    inserted = skipped = 0
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        try:
            supabase.table(table).upsert(batch, on_conflict=conflict).execute()
            inserted += len(batch)
        except Exception as e:
            print(f"  ERROR batch {i//batch_size}: {str(e)[:120]}")
            skipped += len(batch)
    return inserted, skipped

# ─── Reset ───────────────────────────────────────────────────────────────────

def reset_db(supabase: Client):
    print("\n[RESET] Clearing platform data...")
    for table in ["platform_settlements", "platform_orders"]:
        try:
            # Delete all rows using neq on a common column (id is always present)
            res = supabase.table(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            count = len(res.data) if res.data else "?"
            print(f"  Cleared {table} ({count} rows deleted)")
        except Exception as e:
            print(f"  WARN: Could not clear {table}: {e}")
    print("  Done.\n")

# ─── Amazon Parsers ───────────────────────────────────────────────────────────

def parse_amazon_metrics(path, vendor_id):
    records = []
    try:
        row_num = 0
        for headers, row in xlsx_rows(path, header_row=0):
            row_num += 1
            def g(k):
                # Try exact match first, then partial
                idx = next((i for i, h in enumerate(headers) if h.strip() == k), -1)
                if idx < 0:
                    idx = next((i for i, h in enumerate(headers) if k.lower() in h.lower()), -1)
                return row[idx] if idx >= 0 else None
            asin = clean_str(g('ASIN'))
            product_group = clean_str(g('Product group'))
            brand = clean_str(g('Brand name'))
            item_name = clean_str(g('Item name'))
            if product_group == 'Total': continue
            # Support both column naming conventions
            units = clean_num(g('Units sold')) or clean_num(g('Units shipped')) or 0
            if units <= 0: continue
            start = clean_str(g('Start date'))
            uid = f"amz-{asin or brand or product_group}-{path.stem}-{row_num}"
            records.append({
                "vendor_id": vendor_id,
                "platform": "amazon",
                "platform_order_id": uid,
                "platform_order_item_id": uid,
                "order_date": clean_date(start),
                "sku": clean_str(g('MSKU')) or asin or product_group,
                "product_name": item_name or brand,
                "quantity": int(units),
                "mrp": clean_num(g('Average sales price')) or clean_num(g('Average selling price')),
                "sale_amount": (clean_num(g('Net sales')) or clean_num(g('Sales from units shipped'))
                                or clean_num(g('Sales'))),
                "status": "DELIVERED",
                "raw_data": {h.strip(): str(v) for h, v in zip(headers, row) if v is not None and h},
            })
    except Exception as e:
        print(f"  Parse error {path.name}: {e}")
    return records

def parse_amazon_returns(path, vendor_id):
    records = []
    try:
        with open(path, encoding='utf-8-sig') as f:
            reader = csv.DictReader(f, delimiter='\t')
            for row in reader:
                oid = row.get('Order ID', '').strip()
                if not oid: continue
                records.append({
                    "vendor_id": vendor_id,
                    "platform": "amazon",
                    "platform_order_id": oid,
                    "platform_order_item_id": oid,
                    "order_date": clean_date(row.get('Order date') or row.get('Return request date')),
                    "sku": row.get(' Merchant SKU', row.get('Merchant SKU', '')).strip(),
                    "product_name": row.get('Item Name', '').strip()[:255],
                    "quantity": int(row.get('Return quantity', 1) or 1),
                    "status": "RETURNED",
                    "return_reason": row.get('Return reason', '').strip(),
                    "raw_data": dict(row),
                })
    except Exception as e:
        print(f"  Returns parse error {path.name}: {e}")
    return records

# ─── Firstcry Parsers ─────────────────────────────────────────────────────────

def parse_firstcry_orders(path, vendor_id):
    records = []
    try:
        for headers, row in xlsx_rows(path, header_row=0):
            def g(k): return row[headers.index(k)] if k in headers else None
            poid = clean_str(g('POID'))
            if not poid: continue
            records.append({
                "vendor_id": vendor_id,
                "platform": "firstcry",
                "platform_order_id": poid,
                "platform_order_item_id": poid,
                "order_date": clean_date(g('OrderDate')),
                "sku": clean_str(g('VendorStyleCode')) or clean_str(g('ProductID')),
                "product_name": clean_str(g('Brand Name')),
                "quantity": int(g('Quantity') or 1),
                "mrp": clean_num(g('MRP')),
                "sale_amount": clean_num(g('MRP Sales')) or clean_num(g('MRP')),
                "category": clean_str(g('categoryname')),
                "subcategory": clean_str(g('subcategoryname')),
                "raw_data": {h: str(v) for h, v in zip(headers, row) if v is not None},
            })
    except Exception as e:
        print(f"  Firstcry orders parse error {path.name}: {e}")
    return records

def parse_firstcry_reconciliation(path, vendor_id):
    records = []
    try:
        # Headers are at row index 4 in ExplortPaymentAdvice files
        for header_row in [4, 0]:
            test = list(xlsx_rows(path, header_row=header_row))
            if test and 'FC Ref. no.' in test[0][0]:
                break
        for headers, row in xlsx_rows(path, header_row=header_row):
            def g(k): return row[headers.index(k)] if k in headers else None
            ref = clean_str(g('FC Ref. no.'))
            if not ref: continue
            cgst = clean_num(g('CGST Amount')) or 0
            sgst = clean_num(g('SGST Amount')) or 0
            records.append({
                "vendor_id": vendor_id,
                "platform": "firstcry",
                "settlement_ref": clean_str(g('Payment advice no')) or ref,
                "platform_order_id": clean_str(g('Order Ids')),
                "payment_date": clean_date(g('Delivery date')),
                "sale_amount": clean_num(g('Gross Amount')),
                "tcs": (cgst + sgst) or None,
                "net_settlement": clean_num(g('Total')),
                "raw_data": {h: str(v) for h, v in zip(headers, row) if v is not None},
            })
    except Exception as e:
        print(f"  Firstcry recon parse error {path.name}: {e}")
    return records

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Fetch vendor_id
    res = supabase.table("vendors").select("*").limit(1).execute()
    if not res.data:
        print("ERROR: No vendors found. Seed test accounts first.")
        sys.exit(1)
    vendor_id = res.data[0]["vendor_id"]
    name_col = next((k for k in ("business_name", "name", "company_name") if k in res.data[0]), None)
    display = res.data[0].get(name_col, vendor_id) if name_col else vendor_id
    print(f"Using vendor: {display} ({vendor_id})")

    # 1. Reset
    reset_db(supabase)

    tmpdir = Path(tempfile.mkdtemp())
    total_orders = total_settlements = 0

    try:
        # 2. Amazon
        print("[1/2] Amazon")
        az_tmp = tmpdir / "amazon"
        with zipfile.ZipFile(AMAZON_ZIP) as z:
            z.extractall(az_tmp)
        az_dir = az_tmp / "Amazon"

        for f in sorted(az_dir.glob("metric-data*.xlsx")):
            print(f"  Metrics: {f.name}")
            recs = parse_amazon_metrics(f, vendor_id)
            if recs:
                ins, skip = batch_upsert(supabase, "platform_orders", recs,
                                         "vendor_id,platform,platform_order_id,platform_order_item_id")
                print(f"    → {ins} inserted, {skip} skipped")
                total_orders += ins

        for f in sorted(az_dir.glob("report-*.tsv")):
            print(f"  Returns: {f.name}")
            recs = parse_amazon_returns(f, vendor_id)
            if recs:
                ins, skip = batch_upsert(supabase, "platform_orders", recs,
                                         "vendor_id,platform,platform_order_id,platform_order_item_id")
                print(f"    → {ins} inserted, {skip} skipped")
                total_orders += ins

        # 3. Firstcry
        print("\n[2/2] Firstcry")
        fc_tmp = tmpdir / "firstcry"
        with zipfile.ZipFile(FIRSTCRY_ZIP) as z:
            z.extractall(fc_tmp)
        fc_dir = fc_tmp / "Firstcry"

        for f in sorted(fc_dir.glob("dashboardsale*.xlsx")):
            print(f"  Orders: {f.name}")
            recs = parse_firstcry_orders(f, vendor_id)
            if recs:
                ins, skip = batch_upsert(supabase, "platform_orders", recs,
                                         "vendor_id,platform,platform_order_id,platform_order_item_id")
                print(f"    → {ins} inserted, {skip} skipped")
                total_orders += ins

        for f in sorted(fc_dir.glob("ExplortPaymentAdviceData*.xlsx")):
            print(f"  Reconciliation: {f.name}")
            recs = parse_firstcry_reconciliation(f, vendor_id)
            if recs:
                ins, skip = batch_upsert(supabase, "platform_settlements", recs,
                                         "vendor_id,platform,settlement_ref,platform_order_id")
                print(f"    → {ins} inserted, {skip} skipped")
                total_settlements += ins

    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

    print(f"\n✓ Done. {total_orders} orders, {total_settlements} settlements imported.")

if __name__ == "__main__":
    main()
