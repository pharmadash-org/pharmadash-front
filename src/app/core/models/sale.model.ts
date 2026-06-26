export interface SaleItem {
  medicationId: string;
  quantity: number;
}

export interface CreateSaleDto {
  items: SaleItem[];
}

// Estado local del carrito (no se persiste hasta "Procesar Venta")
export interface CartLine {
  medicationId: string;
  name: string;
  sku: string;
  unitPrice: number; // ya parseado con parseFloat()
  quantity: number;
  stock: number;
}
