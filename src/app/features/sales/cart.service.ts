import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Medication } from '../../core/models/medication.model';
import { CartLine } from '../../core/models/sale.model';

export interface CartAddResult {
  ok: boolean;
  message?: string;
}

/**
 * Carrito de venta compartido (estado local, no se persiste en backend hasta
 * "Procesar venta"). Se llena tanto desde el módulo de Ventas como desde
 * Inventario.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly linesSubject = new BehaviorSubject<CartLine[]>([]);
  readonly lines$: Observable<CartLine[]> = this.linesSubject.asObservable();

  get lines(): CartLine[] {
    return this.linesSubject.value;
  }

  get total(): number {
    return this.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  }

  /** Agrega o acumula un medicamento respetando el stock disponible. */
  add(med: Medication, quantity: number): CartAddResult {
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { ok: false, message: 'Cantidad inválida' };
    }
    const lines = [...this.lines];
    const existing = lines.find((l) => l.medicationId === med.id);
    const requested = (existing?.quantity ?? 0) + quantity;
    if (requested > med.stock) {
      return { ok: false, message: `Stock insuficiente: máximo ${med.stock}` };
    }

    if (existing) {
      existing.quantity = requested;
    } else {
      lines.push({
        medicationId: med.id,
        name: med.name,
        sku: med.sku,
        unitPrice: parseFloat(med.price),
        quantity,
        stock: med.stock,
      });
    }
    this.linesSubject.next(lines);
    return { ok: true };
  }

  removeAt(index: number): void {
    this.linesSubject.next(this.lines.filter((_, i) => i !== index));
  }

  clear(): void {
    this.linesSubject.next([]);
  }
}
