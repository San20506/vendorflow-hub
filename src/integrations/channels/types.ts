/**
 * Channel connector types and interfaces
 * Defines the contract for all channel implementations (Shopify, Amazon, WooCommerce, etc.)
 */

export enum Channel {
  SHOPIFY = 'shopify',
  AMAZON = 'amazon',
  WOOCOMMERCE = 'woocommerce',
}

/**
 * OAuth token response from channel platform
 */
export interface AuthToken {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

/**
 * Product data structure from external channel
 * Normalized format across all channels (Shopify, Amazon, WooCommerce)
 */
export interface ChannelProduct {
  external_id: string;  // Platform's product ID (e.g., Shopify product_id)
  sku?: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  stock_level: number;
  image_url?: string;
  url?: string;
  metadata?: Record<string, any>;  // Platform-specific data
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  synced: number;  // Count of products successfully synced
  errors: number;  // Count of products that failed to sync
  error_details?: Array<{ external_id: string; reason: string }>;
  duration_ms: number;
  timestamp: Date;
}

/**
 * Current status of a channel connection
 */
export interface ChannelStatus {
  channel_id: string;
  platform: Channel;
  is_connected: boolean;
  last_sync_at?: Date;
  last_error?: string;
  sync_status: 'idle' | 'syncing' | 'error';
  product_count: number;
}

/**
 * Main connector interface - all channels must implement
 */
export interface IConnector {
  /**
   * Generate OAuth authorization URL
   * Vendor is redirected here to grant access
   */
  getAuthUrl(vendorId: string, redirectUri: string): Promise<string>;

  /**
   * Handle OAuth callback and exchange code for access token
   * Called after vendor approves auth on platform
   */
  handleAuthCallback(code: string, state: string): Promise<AuthToken>;

  /**
   * Fetch products from the channel platform
   * Returns async iterator for pagination support
   */
  fetchProducts(vendorId: string, page?: number): AsyncIterable<ChannelProduct[]>;

  /**
   * Sync all products from channel into local database
   * Handles insert/update logic, deduplication
   */
  syncProducts(vendorId: string): Promise<SyncResult>;

  /**
   * Get current channel connection status
   */
  getStatus(vendorId: string): Promise<ChannelStatus>;
}

/**
 * Connector registry for discovering available channels
 */
export class ConnectorRegistry {
  private connectors: Map<Channel, IConnector> = new Map();

  register(channel: Channel, connector: IConnector): void {
    this.connectors.set(channel, connector);
  }

  get(channel: Channel): IConnector | undefined {
    return this.connectors.get(channel);
  }

  getAll(): Map<Channel, IConnector> {
    return this.connectors;
  }

  isSupported(channel: Channel): boolean {
    return this.connectors.has(channel);
  }
}

// Global registry instance
export const connectorRegistry = new ConnectorRegistry();
