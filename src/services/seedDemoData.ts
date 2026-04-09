/**
 * Demo Data Seeding Service
 * Uses the admin SDK to seed test data for development
 *
 * Usage:
 *   import { seedDemoData } from '@/services/seedDemoData'
 *   await seedDemoData()
 */

import { seedDemoData as adminSeedDemoData } from '@/lib/supabase-admin';

export async function seedDemoData(): Promise<{ success: boolean }> {
  console.log('Seeding demo data...');
  try {
    const result = await adminSeedDemoData();
    console.log('Demo data seeded successfully');
    return result as { success: boolean };
  } catch (error) {
    console.error('Failed to seed demo data:', error);
    throw error;
  }
}

/**
 * Reset and reseed the database
 * WARNING: This will delete all data!
 */
export async function resetDemoData(): Promise<void> {
  console.warn('⚠️  This will reset all data in the database!');
  try {
    // Note: Full reset functionality would require additional admin functions
    // For now, recommend using Supabase dashboard to reset
    console.log('To reset database, use Supabase dashboard or run migrations');
  } catch (error) {
    console.error('Failed to reset database:', error);
    throw error;
  }
}
