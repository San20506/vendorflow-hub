/**
 * Shopify Connector Implementation
 * Handles Shopify OAuth and product sync
 */

import { BaseConnector } from '../base-connector';
import { Channel, AuthToken, ChannelProduct } from '../types';
import { shopifyConfig } from '../../../lib/shopify-config';
import { generateOAuthUrl, exchangeAuthCode, verifyState } from './shopify-auth';
import { supabase } from '../../supabase/client';

const SHOPIFY_REST_API = 'https://{shop}/admin/api/{apiVersion}';

export class ShopifyConnector extends BaseConnector {
  constructor(vendorId: string) {
    super(Channel.SHOPIFY, vendorId);
  }

  /**
   * Generate Shopify OAuth authorization URL
   */
  async getAuthUrl(vendorId: string, redirectUri: string): Promise<string> {
    return generateOAuthUrl(vendorId, redirectUri);
  }

  /**
   * Handle OAuth callback: exchange code for access token
   */
  async handleAuthCallback(code: string, state: string): Promise<AuthToken> {
    // Verify state token (CSRF protection)
    if (!verifyState(state, this.vendorId)) {
      throw new Error('Invalid state token - CSRF validation failed');
    }

    // Exchange code for access token
    const response = await exchangeAuthCode(
      code,
      shopifyConfig.redirectUri
    );

    // Store auth token in database
    await this.storeAuth(this.vendorId, response.shop, {
      access_token: response.access_token,
      token_type: response.token_type,
    });

    return {
      access_token: response.access_token,
      token_type: response.token_type,
    };
  }

  /**
   * Fetch products from Shopify using REST API with pagination
   * Yields batches of products for efficient processing
   */
  async *fetchProducts(vendorId: string, page?: number): AsyncGenerator<ChannelProduct[]> {
    try {
      const channel = await this.getChannelConnection(vendorId);
      if (!channel?.access_token) {
        throw new Error('Shopify channel not authenticated');
      }

      const shop = channel.external_account_id;
      let cursor = '';
      let hasMore = true;
      const limit = 250;  // Shopify API max

      while (hasMore) {
        // Build API URL with pagination
        const apiUrl = this.buildApiUrl(shop, '/products.json', {
          limit,
          ...(cursor ? { cursor } : {}),
        });

        // Fetch products from Shopify
        const response = await this.fetchFromShopify(apiUrl, channel.access_token);

        if (!response.ok) {
          throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as any;
        const products = data.products || [];

        // Convert Shopify products to our normalized format
        const normalizedProducts = products.map((p: any) => this.normalizeProduct(p));
        yield normalizedProducts;

        // Check if there are more pages
        const linkHeader = response.headers.get('link');
        const nextLink = linkHeader?.includes('rel="next"');
        hasMore = !!nextLink;

        // Extract cursor for next page
        if (nextLink && linkHeader) {
          cursor = extractCursorFromLink(linkHeader);
        }
      }
    } catch (err) {
      console.error('[Shopify] Product fetch error:', err);
      throw err;
    }
  }

  /**
   * Build Shopify REST API URL
   */
  private buildApiUrl(shop: string, endpoint: string, params?: Record<string, any>): string {
    const baseUrl = SHOPIFY_REST_API.replace('{shop}', shop).replace(
      '{apiVersion}',
      shopifyConfig.apiVersion
    );

    const url = new URL(endpoint, baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, String(value));
      });
    }

    return url.toString();
  }

  /**
   * Make authenticated request to Shopify API
   */
  private async fetchFromShopify(url: string, accessToken: string): Promise<Response> {
    return fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Convert Shopify product format to our normalized ChannelProduct
   */
  private normalizeProduct(shopifyProduct: any): ChannelProduct {
    // Get first variant's price (Shopify products have variants, we simplify)
    const variant = shopifyProduct.variants?.[0];
    const price = variant?.price ? parseFloat(variant.price) : 0;
    const stock = variant?.inventory_quantity ?? 0;

    // Get first image URL
    const imageUrl = shopifyProduct.featured_image?.src || '';

    return {
      external_id: String(shopifyProduct.id),
      sku: shopifyProduct.sku || shopifyProduct.handle,
      name: shopifyProduct.title,
      description: shopifyProduct.body_html,
      price,
      stock_level: stock,
      image_url: imageUrl,
      url: shopifyProduct.handle ? `https://shopify.com/products/${shopifyProduct.handle}` : undefined,
      metadata: {
        shopify_product_id: shopifyProduct.id,
        vendor: shopifyProduct.vendor,
        product_type: shopifyProduct.product_type,
        tags: shopifyProduct.tags,
      },
    };
  }
}

/**
 * Extract cursor from Shopify link header for pagination
 */
function extractCursorFromLink(linkHeader: string): string {
  // Link header format: <url?cursor=...>; rel="next"
  const match = linkHeader.match(/cursor=([^&>]+)/);
  return match?.[1] || '';
}

/**
 * Factory function to create Shopify connector
 */
export function createShopifyConnector(vendorId: string): ShopifyConnector {
  return new ShopifyConnector(vendorId);
}
