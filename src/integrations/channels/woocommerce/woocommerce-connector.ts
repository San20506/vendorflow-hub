/**
 * WooCommerce REST API Connector
 * Handles product sync from WooCommerce stores
 */

import { BaseConnector } from '../base-connector';
import { Channel, AuthToken, ChannelProduct } from '../types';
import { validateCredentials, getAuthHeader, normalizeStoreUrl } from './woocommerce-auth';
import { supabase } from '../../supabase/client';

const WOOCOMMERCE_API_VERSION = 'wc/v3';
const PAGE_SIZE = 100;  // Max items per page (WooCommerce REST API max)

export class WooCommerceConnector extends BaseConnector {
  constructor(vendorId: string) {
    super(Channel.WOOCOMMERCE, vendorId);
  }

  /**
   * Generate WooCommerce auth URL (returns form for credentials input)
   * Unlike Shopify/Amazon, WooCommerce uses Basic Auth, not OAuth
   * So we return a placeholder that indicates the user should enter credentials
   */
  async getAuthUrl(vendorId: string, redirectUri: string): Promise<string> {
    // For WooCommerce, we return a signal URL - the UI will show a form instead
    return `${window.location.origin}/auth/woocommerce/callback`;
  }

  /**
   * Handle WooCommerce credential input (store URL, consumer key, secret)
   * Called after user provides credentials via form dialog
   */
  async handleAuthCallback(storeUrl: string, consumerKey: string, consumerSecret: string): Promise<AuthToken> {
    // Normalize store URL
    const normalizedUrl = normalizeStoreUrl(storeUrl);

    // Validate credentials against WooCommerce API
    const validation = await validateCredentials(normalizedUrl, consumerKey, consumerSecret);

    if (!validation.valid) {
      throw new Error(`WooCommerce validation failed: ${validation.error}`);
    }

    // Store auth credentials in database
    // external_account_id stores the normalized store URL (used to build API calls)
    const encodedCreds = btoa(`${consumerKey}:${consumerSecret}`);

    await supabase
      .from('channels')
      .upsert({
        vendor_id: this.vendorId,
        platform: Channel.WOOCOMMERCE,
        external_account_id: normalizedUrl,  // Store URL for API calls
        access_token: encodedCreds,  // Store base64-encoded credentials
        connected_at: new Date().toISOString(),
      });

    return {
      access_token: encodedCreds,
      token_type: 'Basic',
    };
  }

  /**
   * Fetch products from WooCommerce REST API
   * Yields batches of products for efficient processing
   */
  async *fetchProducts(vendorId: string): AsyncGenerator<ChannelProduct[]> {
    try {
      const channel = await this.getChannelConnection(vendorId);
      if (!channel?.access_token || !channel?.external_account_id) {
        throw new Error('WooCommerce channel not authenticated');
      }

      const storeUrl = channel.external_account_id;
      const authHeader = channel.access_token;  // Already base64-encoded from storage

      let page = 1;
      let hasMore = true;

      while (hasMore) {
        // Build API URL with pagination
        const url = new URL(`${storeUrl}/wp-json/${WOOCOMMERCE_API_VERSION}/products`);
        url.searchParams.append('per_page', String(PAGE_SIZE));
        url.searchParams.append('page', String(page));

        // Fetch products from WooCommerce
        const response = await this.fetchFromWooCommerce(url.toString(), authHeader);

        if (!response.ok) {
          throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
        }

        const products = (await response.json()) as any[];

        // Convert WooCommerce products to our normalized format
        const normalizedProducts = products.map((p: any) => this.normalizeProduct(p));
        yield normalizedProducts;

        // Check if there are more pages
        // WooCommerce returns empty array when page exceeds results
        hasMore = products.length >= PAGE_SIZE;
        page++;
      }
    } catch (err) {
      console.error('[WooCommerce] Product fetch error:', err);
      throw err;
    }
  }

  /**
   * Make authenticated request to WooCommerce REST API
   */
  private async fetchFromWooCommerce(url: string, authHeader: string): Promise<Response> {
    return fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Normalize WooCommerce product to our ChannelProduct format
   */
  private normalizeProduct(wooProd: any): ChannelProduct {
    return {
      external_id: String(wooProd.id),
      sku: wooProd.sku || String(wooProd.id),
      name: wooProd.name || 'Untitled',
      description: wooProd.description || wooProd.short_description,
      price: parseFloat(wooProd.price) || 0,
      stock_level: wooProd.stock_quantity || 0,
      image_url: wooProd.images?.[0]?.src,
      url: wooProd.permalink,
      metadata: {
        woo_product_id: wooProd.id,
        woo_status: wooProd.status,
        woo_type: wooProd.type,
        woo_categories: wooProd.categories?.map((c: any) => c.name),
      },
    };
  }
}

/**
 * Factory function to create WooCommerce connector
 */
export function createWooCommerceConnector(vendorId: string): WooCommerceConnector {
  return new WooCommerceConnector(vendorId);
}
