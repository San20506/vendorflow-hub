/**
 * Channel Connectors Registry
 * Initialize and register all available channel connectors
 */

import { Channel, connectorRegistry } from './types';
import { createShopifyConnector } from './shopify/shopify-connector';
import { createAmazonConnector } from './amazon/amazon-connector';
import { createWooCommerceConnector } from './woocommerce/woocommerce-connector';

/**
 * Initialize connector registry on app startup
 * Registers all available channel implementations
 */
export function initializeConnectors(vendorId: string): void {
  // Register Shopify connector
  connectorRegistry.register(Channel.SHOPIFY, createShopifyConnector(vendorId));

  // Register Amazon connector
  connectorRegistry.register(Channel.AMAZON, createAmazonConnector(vendorId));

  // Register WooCommerce connector
  connectorRegistry.register(Channel.WOOCOMMERCE, createWooCommerceConnector(vendorId));
}

/**
 * Get connector for a platform
 */
export function getConnector(vendorId: string, platform: Channel) {
  // Ensure connectors are initialized
  if (connectorRegistry.getAll().size === 0) {
    initializeConnectors(vendorId);
  }

  const connector = connectorRegistry.get(platform);
  if (!connector) {
    throw new Error(`No connector found for platform: ${platform}`);
  }

  return connector;
}

/**
 * Get all available platforms
 */
export function getAvailablePlatforms(): Channel[] {
  return [Channel.SHOPIFY, Channel.AMAZON, Channel.WOOCOMMERCE];
}

// Export connector creators for direct use
export { createShopifyConnector };
export { createAmazonConnector };
export { createWooCommerceConnector };
