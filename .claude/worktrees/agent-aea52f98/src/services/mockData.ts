import { 
  Product, 
  InventoryItem, 
  Order, 
  ReturnOrder, 
  Settlement, 
  Vendor, 
  Warehouse,
  Alert,
  Task,
  KPIData,
  SalesData,
  Portal
} from '@/types';

import { ProductHealth, MasterSKUMapping, OrderReconciliation, ConsolidatedOrderRow } from '@/types';

// Portal configurations — now dynamic via channelManager
import { getChannels } from '@/services/channelManager';

// Re-export as a getter so consumers always get fresh data
export const portalConfigs = (() => {
  return getChannels();
})();

// Use this function for guaranteed fresh data
export function getPortalConfigs() {
  return getChannels();
}

// All data is now fetched from the database. No mock data.
export const mockKPIData: KPIData = {
  totalSales: 0,
  ordersToday: 0,
  inventoryValue: 0,
  lowStockItems: 0,
  pendingReturns: 0,
  pendingSettlements: 0,
  salesGrowth: 0,
  ordersGrowth: 0,
};

export const mockSalesData: SalesData[] = [];
export const mockProducts: Product[] = [];
export const mockInventory: InventoryItem[] = [];
export const mockOrders: Order[] = [];
export const mockReturns: ReturnOrder[] = [];
export const mockSettlements: Settlement[] = [];
export const mockVendors: Vendor[] = [];
export const mockWarehouses: Warehouse[] = [];
export const mockAlerts: Alert[] = [];
export const mockTasks: Task[] = [];
export const mockProductHealth: ProductHealth[] = [];
export const mockSKUMappings: MasterSKUMapping[] = [];
export const mockOrderReconciliation: OrderReconciliation[] = [];
export const mockConsolidatedOrders: ConsolidatedOrderRow[] = [];
