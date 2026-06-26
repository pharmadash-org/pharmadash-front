import { ApiResponse } from '../models/medication.model';

/**
 * El backend envuelve las respuestas en `{ success, data }`, pero algunos
 * endpoints documentan la carga directa. Esta función soporta ambos formatos.
 */
export function unwrap<T>(res: ApiResponse<T> | T): T {
  if (res && typeof res === 'object' && 'success' in (res as object)) {
    return (res as ApiResponse<T>).data as T;
  }
  return res as T;
}
