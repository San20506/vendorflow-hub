/**
 * Amazon Selling Partner API (SP-API) OAuth Authentication
 * Handles vendor-initiated OAuth flow with automatic token refresh
 */

import { shopifyConfig } from '../../../lib/shopify-config';

const AMAZON_OAUTH_AUTHORIZE = 'https://sellercentral.amazon.com/apps/authorize/consent';
const AMAZON_OAUTH_TOKEN = 'https://api.amazon.com/auth/o2/token';

export interface AmazonAuthToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;  // Seconds until access_token expires
  token_type: string;
}

/**
 * Generate Amazon OAuth authorization URL
 * Vendor is redirected here to approve app access
 */
export function generateOAuthUrl(vendorId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    application_id: import.meta.env.VITE_AMAZON_CLIENT_ID || 'demo-client-id',
    redirect_uri: redirectUri,
    state: generateState(vendorId),
    version: 'beta',
  });

  return `${AMAZON_OAUTH_AUTHORIZE}?${params.toString()}`;
}

/**
 * Exchange authorization code for access/refresh tokens
 * Called after vendor approves on Amazon
 */
export async function exchangeAuthCode(
  code: string,
  redirectUri: string
): Promise<AmazonAuthToken> {
  try {
    const response = await fetch(AMAZON_OAUTH_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: import.meta.env.VITE_AMAZON_CLIENT_ID || 'demo-client-id',
        client_secret: import.meta.env.VITE_AMAZON_CLIENT_SECRET || 'demo-client-secret',
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Amazon OAuth failed: ${response.status} ${error}`);
    }

    const data = (await response.json()) as any;

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in || 3600,  // Default 1 hour
      token_type: data.token_type || 'Bearer',
    };
  } catch (err) {
    throw new Error(`Failed to exchange auth code: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Refresh expired access token using refresh token
 * Called automatically when access_token expires
 */
export async function refreshAccessToken(refreshToken: string): Promise<AmazonAuthToken> {
  try {
    const response = await fetch(AMAZON_OAUTH_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: import.meta.env.VITE_AMAZON_CLIENT_ID || 'demo-client-id',
        client_secret: import.meta.env.VITE_AMAZON_CLIENT_SECRET || 'demo-client-secret',
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${error}`);
    }

    const data = (await response.json()) as any;

    // Amazon may or may not return a new refresh_token
    // If not, keep using the original one
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_in: data.expires_in || 3600,
      token_type: data.token_type || 'Bearer',
    };
  } catch (err) {
    throw new Error(`Failed to refresh token: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Check if access token is expired or close to expiring
 */
export function shouldRefreshToken(expiresAt: Date): boolean {
  // Refresh if token expires in less than 5 minutes
  const bufferMs = 5 * 60 * 1000;
  const now = new Date().getTime();
  return expiresAt.getTime() - bufferMs < now;
}

/**
 * Generate CSRF state token for OAuth security
 */
function generateState(vendorId: string): string {
  const random = Math.random().toString(36).substring(7);
  return `${vendorId}:${random}`;
}

/**
 * Verify state token matches vendor
 */
export function verifyState(state: string, vendorId: string): boolean {
  const [storedVendorId] = state.split(':');
  return storedVendorId === vendorId;
}

/**
 * Get list of authorized regions from AWS
 * Amazon sellers may have access to different regions (NA, EU, FE, etc.)
 */
export async function getAuthorizedRegions(accessToken: string): Promise<string[]> {
  try {
    // Simplified: return common regions
    // In production, query actual seller's regions from SP-API
    return ['NA'];  // North America - default
  } catch (err) {
    console.error('[Amazon] Failed to get regions:', err);
    return ['NA'];  // Fallback to NA
  }
}
