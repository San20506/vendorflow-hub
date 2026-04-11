/**
 * WooCommerce REST API Authentication
 * Handles Basic Auth credential validation (no token refresh needed)
 */

/**
 * Validate WooCommerce REST API credentials
 * Tests consumer key/secret against /wp-json/wc/v3/system_status endpoint
 */
export async function validateCredentials(
  storeUrl: string,
  consumerKey: string,
  consumerSecret: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Normalize store URL
    const normalizedUrl = normalizeStoreUrl(storeUrl);

    // Make test request to WooCommerce API
    const authHeader = getAuthHeader(consumerKey, consumerSecret);
    const response = await fetch(
      `${normalizedUrl}/wp-json/wc/v3/system_status`,
      {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { valid: false, error: 'Invalid credentials (401/403)' };
      }
      if (response.status === 404) {
        return { valid: false, error: 'WooCommerce REST API not found (404)' };
      }
      return { valid: false, error: `API error: ${response.status} ${response.statusText}` };
    }

    // Credentials are valid
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Connection failed',
    };
  }
}

/**
 * Encode consumer key and secret to Basic Auth header value
 * WooCommerce uses: Authorization: Basic base64(key:secret)
 */
export function encodeBasicAuth(consumerKey: string, consumerSecret: string): string {
  const credentials = `${consumerKey}:${consumerSecret}`;
  // btoa() is available in browser
  const encoded = typeof btoa !== 'undefined'
    ? btoa(credentials)
    : Buffer.from(credentials).toString('base64');
  return `Basic ${encoded}`;
}

/**
 * Get Authorization header for WooCommerce REST API requests
 */
export function getAuthHeader(consumerKey: string, consumerSecret: string): string {
  return encodeBasicAuth(consumerKey, consumerSecret);
}

/**
 * Normalize WooCommerce store URL
 * Removes trailing slash, ensures https://, normalizes http->https
 */
export function normalizeStoreUrl(url: string): string {
  // Remove trailing slashes
  let normalized = url.trim().replace(/\/$/, '');

  // Add https:// if no protocol specified
  if (!normalized.match(/^https?:\/\//)) {
    normalized = `https://${normalized}`;
  }

  // Convert http to https (WooCommerce best practice)
  normalized = normalized.replace(/^http:/, 'https:');

  return normalized;
}
