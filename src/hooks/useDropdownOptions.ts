import { useState, useEffect } from 'react';
import { dropdownOptionsDb } from '@/services/database';

const DEFAULTS: Record<string, { label: string; value: string }[]> = {
  expense_category: [
    { label: 'Office Miscellaneous', value: 'office_misc' },
    { label: 'Warehouse Miscellaneous', value: 'warehouse_misc' },
    { label: 'Day to Day Expense', value: 'daily' },
    { label: 'Lunch, Tea & Coffee', value: 'food' },
    { label: 'Stationery', value: 'stationery' },
    { label: 'Transport', value: 'transport' },
    { label: 'Tips & Wages', value: 'tips_wages' },
  ],
  payment_mode: [
    { label: 'Cash', value: 'Cash' },
    { label: 'UPI', value: 'UPI' },
    { label: 'Card', value: 'Card' },
    { label: 'Online', value: 'Online' },
    { label: 'Wallet', value: 'Wallet' },
  ],
  paid_by: [
    { label: 'Self', value: 'Self' },
  ],
};

export function useDropdownOptions(fieldType: string) {
  const [options, setOptions] = useState<{ label: string; value: string }[]>(DEFAULTS[fieldType] || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await dropdownOptionsDb.getByFieldType(fieldType);
        if (data.length > 0) {
          setOptions(data.map((d: any) => ({ label: d.label, value: d.value })));
        }
        // else keep defaults
      } catch {
        // keep defaults on error
      } finally {
        setLoading(false);
      }
    })();
  }, [fieldType]);

  return { options, loading };
}
