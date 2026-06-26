export type MedicationCategory =
  | 'Analgesico'
  | 'Antibiotico'
  | 'Antiinflamatorio'
  | 'Antihipertensivo'
  | 'Antidiabetico'
  | 'Vitamina'
  | 'Antihistaminico'
  | 'Antiacido'
  | 'Antidepresivo'
  | 'Otro';

export const MEDICATION_CATEGORIES: MedicationCategory[] = [
  'Analgesico',
  'Antibiotico',
  'Antiinflamatorio',
  'Antihipertensivo',
  'Antidiabetico',
  'Vitamina',
  'Antihistaminico',
  'Antiacido',
  'Antidepresivo',
  'Otro',
];

export interface Medication {
  id: string;
  name: string;
  sku: string;
  category: MedicationCategory;
  description?: string;
  price: string; // Prisma Decimal llega como string — parsear con parseFloat()
  stock: number;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
  isCriticalStock: boolean; // calculado en backend, solo leer
  isNearExpiry: boolean; // calculado en backend, solo leer
}

export interface CreateMedicationDto {
  name: string;
  sku: string;
  category: MedicationCategory;
  description?: string;
  price: number;
  stock: number;
  expiryDate: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ApiErrorDetail[] | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}
