/**
 * Shopify OAuth Configuration
 * Loads from environment variables with fallback to test app credentials
 */

interface ShopifyConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  apiVersion: string;
  usedFallback: boolean;
}

/**
 * Test Shopify app credentials (for demo/development only)
 * These are placeholder values - users should configure their own app
 */
const TEST_APP_CREDENTIALS = {
  clientId: process.env.VITE_SHOPIFY_CLIENT_ID || 'test-client-id-12345',
  clientSecret: process.env.VITE_SHOPIFY_CLIENT_SECRET || 'test-client-secret-67890',
};

/**
 * Load Shopify configuration from environment variables
 * Falls back to test app if env vars not set and VITE_SHOPIFY_ALLOW_FALLBACK is true
 */
export function loadShopifyConfig(): ShopifyConfig {
  const clientId = import.meta.env.VITE_SHOPIFY_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_SHOPIFY_CLIENT_SECRET;
  const redirectUri = import.meta.env.VITE_SHOPIFY_REDIRECT_URI || 'http://localhost:5173/auth/shopify/callback';
  const apiVersion = import.meta.env.VITE_SHOPIFY_API_VERSION || '2025-01';
  const allowFallback = import.meta.env.VITE_SHOPIFY_ALLOW_FALLBACK !== 'false';

  // Check if env vars are set
  const hasEnvVars = clientId && clientSecret;

  if (!hasEnvVars && !allowFallback) {
    throw new Error(
      'Shopify OAuth not configured. Set VITE_SHOPIFY_CLIENT_ID and VITE_SHOPIFY_CLIENT_SECRET in .env.local'
    );
  }

  const usedFallback = !hasEnvVars && allowFallback;

  if (usedFallback) {
    console.warn('[Shopify] Using test app credentials. For production, set .env.local credentials.');
  }

  return {
    clientId: clientId || TEST_APP_CREDENTIALS.clientId,
    clientSecret: clientSecret || TEST_APP_CREDENTIALS.clientSecret,
    redirectUri,
    apiVersion,
    usedFallback,
  };
}

// Export singleton instance
export const shopifyConfig = loadShopifyConfig();
