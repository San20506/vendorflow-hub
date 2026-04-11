/**
 * Base connector abstract class
 * Provides common functionality for all channel implementations
 */

import { supabase } from '../supabase/client';
import { IConnector, Channel, AuthToken, ChannelProduct, SyncResult, ChannelStatus } from './types';

export abstract class BaseConnector implements IConnector {
  protected channel: Channel;
  protected vendorId: string;

  constructor(channel: Channel, vendorId: string) {
    this.channel = channel;
    this.vendorId = vendorId;
  }

  /**
   * Abstract methods - must be implemented by subclasses
   */
  abstract getAuthUrl(vendorId: string, redirectUri: string): Promise<string>;
  abstract handleAuthCallback(code: string, state: string): Promise<AuthToken>;
  abstract fetchProducts(vendorId: string, page?: number): AsyncIterable<ChannelProduct[]>;

  /**
   * Core sync logic - template method pattern
   * Subclasses override fetchProducts() to customize API calls
   */
  async syncProducts(vendorId: string): Promise<SyncResult> {
    const startTime = Date.now();
    let synced = 0;
    let errors = 0;
    const error_details: Array<{ external_id: string; reason: string }> = [];

    try {
      // Update sync status to 'syncing'
      await this.updateSyncStatus(vendorId, 'syncing', undefined);

      // Verify vendor has this channel connected
      const channel = await this.getChannelConnection(vendorId);
      if (!channel) {
        throw new Error('Channel not connected for this vendor');
      }

      // Fetch products from platform and upsert locally
      for await (const productBatch of this.fetchProducts(vendorId)) {
        for (const product of productBatch) {
          try {
            await this.upsertProduct(channel.channel_id, product);
            synced++;
          } catch (err) {
            errors++;
            error_details.push({
              external_id: product.external_id,
              reason: err instanceof Error ? err.message : 'Unknown error',
            });
          }
        }
      }

      // Update sync status to 'idle' on success
      await this.updateSyncStatus(vendorId, 'idle', undefined);

      return {
        synced,
        errors,
        error_details: errors > 0 ? error_details : undefined,
        duration_ms: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (err) {
      // Update sync status to 'error' with message
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      await this.updateSyncStatus(vendorId, 'error', errorMsg);

      return {
        synced,
        errors: errors + 1,  // Count the sync failure itself
        error_details,
        duration_ms: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get channel connection record for vendor
   */
  protected async getChannelConnection(vendorId: string) {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('platform', this.channel)
      .single();

    if (error) throw new Error(`Failed to fetch channel: ${error.message}`);
    return data;
  }

  /**
   * Store authentication token securely
   */
  protected async storeAuth(vendorId: string, externalAccountId: string, token: AuthToken) {
    const { error } = await supabase
      .from('channels')
      .upsert({
        vendor_id: vendorId,
        platform: this.channel,
        external_account_id: externalAccountId,
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        connected_at: new Date().toISOString(),
      });

    if (error) throw new Error(`Failed to store auth: ${error.message}`);
  }

  /**
   * Upsert product from channel into local database
   */
  protected async upsertProduct(channelId: string, product: ChannelProduct) {
    const { error } = await supabase
      .from('products')
      .upsert({
        channel_id: channelId,
        external_product_id: product.external_id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        stock: product.stock_level,
      });

    if (error) throw new Error(`Failed to upsert product: ${error.message}`);
  }

  /**
   * Update channel sync status
   */
  protected async updateSyncStatus(
    vendorId: string,
    status: 'idle' | 'syncing' | 'error',
    error?: string
  ) {
    const { error: dbError } = await supabase
      .from('channels')
      .update({
        sync_status: status,
        sync_error: error || null,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('vendor_id', vendorId)
      .eq('platform', this.channel);

    if (dbError) throw new Error(`Failed to update sync status: ${dbError.message}`);
  }

  /**
   * Get channel status
   */
  async getStatus(vendorId: string): Promise<ChannelStatus> {
    const channel = await this.getChannelConnection(vendorId);
    if (!channel) {
      throw new Error('Channel not connected');
    }

    // Count products for this channel
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('channel_id', channel.channel_id);

    if (error) throw new Error(`Failed to count products: ${error.message}`);

    return {
      channel_id: channel.channel_id,
      platform: this.channel,
      is_connected: true,
      last_sync_at: channel.last_sync_at ? new Date(channel.last_sync_at) : undefined,
      last_error: channel.sync_error,
      sync_status: channel.sync_status,
      product_count: count || 0,
    };
  }

  /**
   * Log sync operation (for debugging/audit)
   */
  protected async logSync(vendorId: string, result: SyncResult) {
    console.log(`[${this.channel.toUpperCase()}] Sync for vendor ${vendorId}:`, {
      synced: result.synced,
      errors: result.errors,
      duration_ms: result.duration_ms,
      timestamp: result.timestamp,
    });
  }
}
