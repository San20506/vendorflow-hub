// Centralized API service structure
// This file contains mock endpoints that are ready for real backend integration

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
  Portal,
  ApiResponse 
} from '@/types';
import { 
  mockProducts, 
  mockInventory, 
  mockOrders, 
  mockReturns, 
  mockSettlements,
  mockVendors,
  mockWarehouses,
  mockAlerts,
  mockTasks,
  mockKPIData,
  mockSalesData
} from './mockData';

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const API_DELAY = 300;

// Base API configuration - ready for real backend
const API_BASE_URL = '/api/v1';

// Generic fetch wrapper for future backend integration
async function fetchApi<T>(
  endpoint: string, 
  options?: RequestInit
): Promise<ApiResponse<T>> {
  // In production, this would be a real fetch call
  // return fetch(`${API_BASE_URL}${endpoint}`, options).then(res => res.json());
  
  // For now, we simulate with mock data
  await delay(API_DELAY);
  
  // This is where the mock data mapping happens
  // Each endpoint returns appropriate mock data
  throw new Error(`Endpoint ${endpoint} not implemented in mock mode`);
}

// Dashboard API
export const dashboardApi = {
  getKPIs: async (portal?: Portal): Promise<ApiResponse<KPIData>> => {
    await delay(API_DELAY);
    return {
      data: mockKPIData,
      success: true,
    };
  },
  
  getSalesData: async (
    startDate: string, 
    endDate: string, 
    portal?: Portal
  ): Promise<ApiResponse<SalesData[]>> => {
    await delay(API_DELAY);
    let data = mockSalesData;
    if (portal) {
      data = data.filter(d => d.portal === portal);
    }
    return {
      data,
      success: true,
    };
  },
};

// Products API
export const productsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }): Promise<ApiResponse<Product[]>> => {
    await delay(API_DELAY);
    let data = [...mockProducts];
    
    if (params?.search) {
      const search = params.search.toLowerCase();
      data = data.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.productId.toLowerCase().includes(search)
      );
    }
    
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const paginatedData = data.slice(start, start + limit);
    
    return {
      data: paginatedData,
      success: true,
      pagination: {
        page,
        limit,
        total: data.length,
        totalPages: Math.ceil(data.length / limit),
      },
    };
  },
  
  getById: async (productId: string): Promise<ApiResponse<Product | null>> => {
    await delay(API_DELAY);
    const product = mockProducts.find(p => p.productId === productId);
    return {
      data: product || null,
      success: !!product,
      message: product ? undefined : 'Product not found',
    };
  },
  
  create: async (product: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Product>> => {
    await delay(API_DELAY);
    const newProduct: Product = {
      ...product,
      productId: `PROD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { data: newProduct, success: true };
  },
  
  update: async (productId: string, updates: Partial<Product>): Promise<ApiResponse<Product | null>> => {
    await delay(API_DELAY);
    const product = mockProducts.find(p => p.productId === productId);
    if (!product) {
      return { data: null, success: false, message: 'Product not found' };
    }
    const updated = { ...product, ...updates, updatedAt: new Date().toISOString() };
    return { data: updated, success: true };
  },
};

// Inventory API
export const inventoryApi = {
  getAll: async (params?: {
    portal?: Portal;
    warehouse?: string;
    lowStock?: boolean;
  }): Promise<ApiResponse<InventoryItem[]>> => {
    await delay(API_DELAY);
    let data = [...mockInventory];
    
    if (params?.portal) {
      data = data.filter(i => i.portal === params.portal);
    }
    if (params?.warehouse) {
      data = data.filter(i => i.warehouse === params.warehouse);
    }
    if (params?.lowStock) {
      data = data.filter(i => i.availableQuantity <= i.lowStockThreshold);
    }
    
    return { data, success: true };
  },
  
  getAgingReport: async (): Promise<ApiResponse<InventoryItem[]>> => {
    await delay(API_DELAY);
    const agingItems = mockInventory.filter(i => i.agingDays > 60);
    return { data: agingItems, success: true };
  },
  
  updateStock: async (
    skuId: string, 
    quantity: number, 
    type: 'add' | 'remove'
  ): Promise<ApiResponse<InventoryItem | null>> => {
    await delay(API_DELAY);
    const item = mockInventory.find(i => i.skuId === skuId);
    if (!item) {
      return { data: null, success: false, message: 'SKU not found' };
    }
    const updated = {
      ...item,
      availableQuantity: type === 'add' 
        ? item.availableQuantity + quantity 
        : Math.max(0, item.availableQuantity - quantity),
      lastUpdated: new Date().toISOString(),
    };
    return { data: updated, success: true };
  },
};

// Orders API
export const ordersApi = {
  getAll: async (params?: {
    portal?: Portal;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Order[]>> => {
    await delay(API_DELAY);
    let data = [...mockOrders];
    
    if (params?.portal) {
      data = data.filter(o => o.portal === params.portal);
    }
    if (params?.status) {
      data = data.filter(o => o.status === params.status);
    }
    
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const paginatedData = data.slice(start, start + limit);
    
    return {
      data: paginatedData,
      success: true,
      pagination: {
        page,
        limit,
        total: data.length,
        totalPages: Math.ceil(data.length / limit),
      },
    };
  },
  
  getById: async (orderId: string): Promise<ApiResponse<Order | null>> => {
    await delay(API_DELAY);
    const order = mockOrders.find(o => o.orderId === orderId);
    return {
      data: order || null,
      success: !!order,
      message: order ? undefined : 'Order not found',
    };
  },
  
  updateStatus: async (
    orderId: string, 
    status: string, 
    note?: string
  ): Promise<ApiResponse<Order | null>> => {
    await delay(API_DELAY);
    const order = mockOrders.find(o => o.orderId === orderId);
    if (!order) {
      return { data: null, success: false, message: 'Order not found' };
    }
    return { data: order, success: true };
  },
  
  exportOrders: async (params?: { portal?: Portal; status?: string }): Promise<ApiResponse<string>> => {
    await delay(API_DELAY);
    // In production, this would return a download URL
    return { data: 'export-url-placeholder', success: true };
  },
};

// Returns API
export const returnsApi = {
  getAll: async (params?: {
    portal?: Portal;
    status?: string;
  }): Promise<ApiResponse<ReturnOrder[]>> => {
    await delay(API_DELAY);
    let data = [...mockReturns];
    
    if (params?.portal) {
      data = data.filter(r => r.portal === params.portal);
    }
    if (params?.status) {
      data = data.filter(r => r.status === params.status);
    }
    
    return { data, success: true };
  },
  
  getById: async (returnId: string): Promise<ApiResponse<ReturnOrder | null>> => {
    await delay(API_DELAY);
    const returnOrder = mockReturns.find(r => r.returnId === returnId);
    return {
      data: returnOrder || null,
      success: !!returnOrder,
    };
  },
};

// Settlements API
export const settlementsApi = {
  getAll: async (params?: {
    portal?: Portal;
    status?: string;
  }): Promise<ApiResponse<Settlement[]>> => {
    await delay(API_DELAY);
    let data = [...mockSettlements];
    
    if (params?.portal) {
      data = data.filter(s => s.portal === params.portal);
    }
    if (params?.status) {
      data = data.filter(s => s.status === params.status);
    }
    
    return { data, success: true };
  },
  
  getById: async (settlementId: string): Promise<ApiResponse<Settlement | null>> => {
    await delay(API_DELAY);
    const settlement = mockSettlements.find(s => s.settlementId === settlementId);
    return {
      data: settlement || null,
      success: !!settlement,
    };
  },
};

// Vendors API
export const vendorsApi = {
  getAll: async (): Promise<ApiResponse<Vendor[]>> => {
    await delay(API_DELAY);
    return { data: mockVendors, success: true };
  },
  
  getById: async (vendorId: string): Promise<ApiResponse<Vendor | null>> => {
    await delay(API_DELAY);
    const vendor = mockVendors.find(v => v.vendorId === vendorId);
    return {
      data: vendor || null,
      success: !!vendor,
    };
  },
  
  getWarehouses: async (vendorId: string): Promise<ApiResponse<Warehouse[]>> => {
    await delay(API_DELAY);
    const warehouses = mockWarehouses.filter(w => w.vendorId === vendorId);
    return { data: warehouses, success: true };
  },
};

// Warehouses API
export const warehousesApi = {
  getAll: async (): Promise<ApiResponse<Warehouse[]>> => {
    await delay(API_DELAY);
    return { data: mockWarehouses, success: true };
  },
};

// Alerts API
export const alertsApi = {
  getAll: async (params?: {
    severity?: string;
    type?: string;
    unreadOnly?: boolean;
  }): Promise<ApiResponse<Alert[]>> => {
    await delay(API_DELAY);
    let data = [...mockAlerts];
    
    if (params?.severity) {
      data = data.filter(a => a.severity === params.severity);
    }
    if (params?.type) {
      data = data.filter(a => a.type === params.type);
    }
    if (params?.unreadOnly) {
      data = data.filter(a => !a.read);
    }
    
    return { data, success: true };
  },
  
  markAsRead: async (alertId: string): Promise<ApiResponse<boolean>> => {
    await delay(API_DELAY);
    return { data: true, success: true };
  },
  
  markAllAsRead: async (): Promise<ApiResponse<boolean>> => {
    await delay(API_DELAY);
    return { data: true, success: true };
  },
};

// Tasks API
export const tasksApi = {
  getAll: async (params?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
  }): Promise<ApiResponse<Task[]>> => {
    await delay(API_DELAY);
    let data = [...mockTasks];
    
    if (params?.status) {
      data = data.filter(t => t.status === params.status);
    }
    if (params?.priority) {
      data = data.filter(t => t.priority === params.priority);
    }
    
    return { data, success: true };
  },
  
  updateStatus: async (taskId: string, status: string): Promise<ApiResponse<Task | null>> => {
    await delay(API_DELAY);
    const task = mockTasks.find(t => t.taskId === taskId);
    if (!task) {
      return { data: null, success: false, message: 'Task not found' };
    }
    return { data: task, success: true };
  },
};
