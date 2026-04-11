/**
 * Channel data access layer
 * Queries for managing channels and channel products
 */

import { supabase } from '../integrations/supabase/client';
import { Database } from '../integrations/supabase/types';

type Channel = Database['public']['Tables']['channels']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

/**
 * Get all channels for a vendor
 */
export async function getChannelsForVendor(vendorId: string): Promise<Channel[]> {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch channels: ${error.message}`);
  return data || [];
}

/**
 * Get a specific channel by ID
 */
export async function getChannelById(channelId: string): Promise<Channel | null> {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('channel_id', channelId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch channel: ${error.message}`);
  }

  return data || null;
}

/**
 * Get channel by vendor and platform
 */
export async function getChannelByPlatform(
  vendorId: string,
  platform: string
): Promise<Channel | null> {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('platform', platform)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch channel: ${error.message}`);
  }

  return data || null;
}

/**
 * Delete a channel (and cascade-delete associated products)
 */
export async function deleteChannel(channelId: string): Promise<void> {
  const { error } = await supabase
    .from('channels')
    .delete()
    .eq('channel_id', channelId);

  if (error) throw new Error(`Failed to delete channel: ${error.message}`);
}

/**
 * Get products synced from a specific channel
 */
export async function getChannelProducts(channelId: string, limit = 100): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('channel_id', channelId)
    .limit(limit)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch channel products: ${error.message}`);
  return data || [];
}

/**
 * Count products synced from a channel
 */
export async function countChannelProducts(channelId: string): Promise<number> {
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('channel_id', channelId);

  if (error) throw new Error(`Failed to count channel products: ${error.message}`);
  return count || 0;
}

/**
 * Update channel sync status and last sync timestamp
 */
export async function updateChannelSyncStatus(
  channelId: string,
  status: 'idle' | 'syncing' | 'error',
  error?: string
): Promise<void> {
  const { error: dbError } = await supabase
    .from('channels')
    .update({
      sync_status: status,
      sync_error: error || null,
      last_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('channel_id', channelId);

  if (dbError) throw new Error(`Failed to update sync status: ${dbError.message}`);
}

/**
 * Get channel sync status info
 */
export async function getChannelSyncStatus(channelId: string) {
  const channel = await getChannelById(channelId);
  if (!channel) throw new Error('Channel not found');

  const productCount = await countChannelProducts(channelId);

  return {
    channel_id: channel.channel_id,
    platform: channel.platform,
    sync_status: channel.sync_status,
    last_sync_at: channel.last_sync_at,
    sync_error: channel.sync_error,
    product_count: productCount,
  };
}
