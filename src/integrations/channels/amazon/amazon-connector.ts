/**
 * Amazon Selling Partner API (SP-API) Connector
 * Handles product sync from Amazon Seller Central
 */

import { BaseConnector } from '../base-connector';
import { Channel, AuthToken, ChannelProduct } from '../types';
import { generateOAuthUrl, exchangeAuthCode, refreshAccessToken, shouldRefreshToken, verifyState, getAuthorizedRegions, AmazonAuthToken } from './amazon-auth';
import { supabase } from '../../supabase/client';

const AMAZON_SP_API_BASE = 'https://sellingpartnerapi-{region}.amazon.com/catalog/v0';
const RATE_LIMIT_DELAY_MS = 500;  // 2 requests per second (SP-API rate limit)

export class AmazonConnector extends BaseConnector {
  constructor(vendorId: string) {
    super(Channel.AMAZON, vendorId);
  }

  /**
   * Generate Amazon OAuth authorization URL
   */
  async getAuthUrl(vendorId: string, redirectUri: string): Promise<string> {
    return generateOAuthUrl(vendorId, redirectUri);
  }

  /**
   * Handle OAuth callback: exchange code for access/refresh tokens
   */
  async handleAuthCallback(code: string, state: string): Promise<AuthToken> {
    // Verify state token (CSRF protection)
    if (!verifyState(state, this.vendorId)) {
      throw new Error('Invalid state token - CSRF validation failed');
    }

    // Exchange code for tokens
    const response = await exchangeAuthCode(code, `${window.location.origin}/auth/amazon/callback`);

    // Store auth tokens in database (with auto-refresh support)
    const expiresAt = new Date(Date.now() + response.expires_in * 1000);

    await supabase
      .from('channels')
      .upsert({
        vendor_id: this.vendorId,
        platform: Channel.AMAZON,
        external_account_id: 'amazon-seller-account',  // Simplified - in production, get actual seller ID
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        connected_at: new Date().toISOString(),
      });

    return {
      access_token: response.access_token,
      refresh_token: response.refresh_token,
    };
  }

  /**
   * Refresh access token if expired
   */
  private async ensureValidAccessToken(channel: any): Promise<string> {
    // Check if token needs refresh
    if (channel.access_token && channel.refresh_token) {
      const expiresAt = new Date(channel.updated_at);
      expiresAt.setHours(expiresAt.getHours() + 1);  // Assume 1 hour expiry

      if (shouldRefreshToken(expiresAt)) {
        try {
          const newTokens = await refreshAccessToken(channel.refresh_token);

          // Update stored tokens
          await supabase
            .from('channels')
            .update({
              access_token: newTokens.access_token,
              refresh_token: newTokens.refresh_token,
              updated_at: new Date().toISOString(),
            })
            .eq('channel_id', channel.channel_id);

          return newTokens.access_token;
        } catch (err) {
          throw new Error(`Failed to refresh Amazon token: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    return channel.access_token;
  }

  /**
   * Fetch products from Amazon using SP-API
   * Yields products by region
   */
  async *fetchProducts(vendorId: string): AsyncGenerator<ChannelProduct[]> {
    try {
      const channel = await this.getChannelConnection(vendorId);
      if (!channel?.access_token) {
        throw new Error('Amazon channel not authenticated');
      }

      // Ensure token is fresh
      const accessToken = await this.ensureValidAccessToken(channel);

      // Get authorized regions
      const regions = await getAuthorizedRegions(accessToken);

      for (const region of regions) {
        yield* this.fetchProductsForRegion(region, accessToken);
      }
    } catch (err) {
      console.error('[Amazon] Product fetch error:', err);
      throw err;
    }
  }

  /**
   * Fetch products for a specific region
   */
  private async *fetchProductsForRegion(region: string, accessToken: string): AsyncGenerator<ChannelProduct[]> {
    let pageToken: string | undefined;
    const pageSize = 20;  // SP-API max results per page

    while (true) {
      // Build API URL
      const url = new URL(`${AMAZON_SP_API_BASE.replace('{region}', region)}/items`);
      url.searchParams.append('pageSize', String(pageSize));
      if (pageToken) {
        url.searchParams.append('pageToken', pageToken);
      }

      // Fetch products for this page
      const response = await this.fetchFromAmazonAPI(url.toString(), accessToken);

      if (!response.ok) {
        throw new Error(`Amazon API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      const items = data.items || [];

      // Normalize products
      const normalizedProducts = items.map((item: any) => this.normalizeProduct(item));
      yield normalizedProducts;

      // Check for more pages
      pageToken = data.pagination?.nextPageToken;
      if (!pageToken) break;

      // Respect rate limit
      await this.delay(RATE_LIMIT_DELAY_MS);
    }
  }

  /**
   * Make authenticated request to Amazon SP-API
   */
  private async fetchFromAmazonAPI(url: string, accessToken: string): Promise<Response> {
    return fetch(url, {
      method: 'GET',
      headers: {
        'x-amz-access-token': accessToken,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Normalize Amazon product to our ChannelProduct format
   */
  private normalizeProduct(amazonItem: any): ChannelProduct {
    const asin = amazonItem.asin;
    const price = amazonItem.offers?.[0]?.price?.amount || 0;
    const stock = amazonItem.inventory?.fulfillableQuantity || 0;

    return {
      external_id: asin,
      sku: amazonItem.sku || asin,
      name: amazonItem.title || 'Untitled',
      description: amazonItem.description,
      price: parseFloat(String(price)),
      stock_level: stock,
      image_url: amazonItem.images?.[0]?.link,
      url: `https://www.amazon.com/dp/${asin}`,
      metadata: {
        amazon_asin: asin,
        amazon_sku: amazonItem.sku,
        bullet_points: amazonItem.bulletPoints,
        attributes: amazonItem.attributes,
      },
    };
  }

  /**
   * Delay execution (for rate limiting)
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create Amazon connector
 */
export function createAmazonConnector(vendorId: string): AmazonConnector {
  return new AmazonConnector(vendorId);
}
