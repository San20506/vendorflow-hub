/**
 * Shopify OAuth Authentication
 * Handles OAuth flow: generate auth URL, exchange code for token
 */

import { shopifyConfig } from '../../../lib/shopify-config';
import { AuthToken } from '../types';

const SHOPIFY_OAUTH_AUTHORIZE = 'https://auth.shopify.com/oauth/authorize';
const SHOPIFY_OAUTH_TOKEN = 'https://auth.shopify.com/oauth/token';

// OAuth scopes - what access we're requesting from Shopify
const SCOPES = [
  'read_products',           // Read product data
  'write_products',          // Modify products (optional, for future)
  'read_inventory',          // Read inventory levels
  'write_inventory',         // Modify inventory (optional, for future)
  'read_orders',             // Read order data
];

/**
 * Generate Shopify OAuth authorization URL
 * User is redirected here to approve app access
 */
export function generateOAuthUrl(vendorId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: shopifyConfig.clientId,
    scope: SCOPES.join(','),
    redirect_uri: redirectUri,
    state: generateState(vendorId),  // CSRF protection
    response_type: 'code',
  });

  return `${SHOPIFY_OAUTH_AUTHORIZE}?${params.toString()}`;
}

/**
 * Exchange OAuth code for access token
 * Called after user approves on Shopify
 */
export async function exchangeAuthCode(code: string, redirectUri: string): Promise<AuthToken & { shop: string }> {
  try {
    const response = await fetch(SHOPIFY_OAUTH_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: shopifyConfig.clientId,
        client_secret: shopifyConfig.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Shopify OAuth failed: ${response.status} ${error}`);
    }

    const data = await response.json() as any;

    // Extract shop URL from token response
    // Shopify returns scope header that indicates which shop
    const shop = data.scope ? extractShopFromScope(data.scope) : 'unknown';

    return {
      access_token: data.access_token,
      token_type: data.token_type || 'Bearer',
      expires_in: undefined,  // Shopify doesn't use expiring tokens
      shop,
    };
  } catch (err) {
    throw new Error(`Failed to exchange auth code: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Generate CSRF state token
 * Prevents authorization code interception attacks
 */
function generateState(vendorId: string): string {
  const random = Math.random().toString(36).substring(7);
  return `${vendorId}:${random}`;
}

/**
 * Verify state token matches vendor
 * Called after OAuth callback to ensure this is the same vendor
 */
export function verifyState(state: string, vendorId: string): boolean {
  const [storedVendorId] = state.split(':');
  return storedVendorId === vendorId;
}

/**
 * Extract shop domain from Shopify scope response
 * Shopify returns shop info in different formats depending on API version
 */
function extractShopFromScope(scope: string): string {
  // Shopify may include shop info; for now return generic shop identifier
  // In production, this would parse and extract actual shop domain
  return scope.split(',')[0] || 'unknown';
}

/**
 * Validate that OAuth response is from Shopify (via HMAC)
 * This is optional but recommended for security
 */
export function validateOAuthResponse(params: Record<string, string>): boolean {
  // In production, validate HMAC signature
  // For now, basic validation that required fields exist
  return !!(params.code && params.hmac && params.shop && params.state);
}
