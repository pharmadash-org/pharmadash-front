export interface KpiResponse {
  dailyRevenue: number;
  criticalStockCount: number;
  nearExpiryCount: number;
}

export interface TopSoldItem {
  medicationId: string;
  name: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
}

export type AppRole = 'Admin' | 'Vendedor';

export interface AppUser {
  name: string;
  email: string;
  roles: string[];
}
