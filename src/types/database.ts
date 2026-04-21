export type { Database } from '@/integrations/supabase/types';

import type { Database as SupabaseDatabase } from '@/integrations/supabase/types';

export type UserRole = SupabaseDatabase['public']['Enums']['app_role'];
