import { CartService } from './cart.service';
import { Medication } from '../../core/models/medication.model';

function med(partial: Partial<Medication> = {}): Medication {
  return {
    id: 'm1',
    name: 'Ibuprofeno',
    sku: 'IBU-400',
    category: 'Antiinflamatorio',
    price: '1500.50',
    stock: 10,
    expiryDate: '2027-01-01',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    isCriticalStock: false,
    isNearExpiry: false,
    ...partial,
  };
}

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    service = new CartService();
  });

  it('agrega un medicamento parseando el precio', () => {
    expect(service.add(med(), 2)).toEqual({ ok: true });
    expect(service.lines.length).toBe(1);
    expect(service.lines[0].unitPrice).toBe(1500.5);
    expect(service.total).toBe(3001);
  });

  it('acumula la cantidad del mismo medicamento', () => {
    service.add(med(), 2);
    service.add(med(), 3);
    expect(service.lines.length).toBe(1);
    expect(service.lines[0].quantity).toBe(5);
  });

  it('rechaza si supera el stock disponible', () => {
    service.add(med({ stock: 4 }), 3);
    const res = service.add(med({ stock: 4 }), 2);
    expect(res.ok).toBeFalse();
    expect(res.message).toContain('máximo 4');
    expect(service.lines[0].quantity).toBe(3);
  });

  it('rechaza cantidades inválidas', () => {
    expect(service.add(med(), 0).ok).toBeFalse();
    expect(service.add(med(), 1.5).ok).toBeFalse();
    expect(service.lines.length).toBe(0);
  });

  it('quita una línea y limpia el carrito', () => {
    service.add(med({ id: 'a' }), 1);
    service.add(med({ id: 'b' }), 1);
    service.removeAt(0);
    expect(service.lines.length).toBe(1);
    expect(service.lines[0].medicationId).toBe('b');
    service.clear();
    expect(service.lines.length).toBe(0);
    expect(service.total).toBe(0);
  });

  it('emite los cambios por lines$', (done) => {
    const emissions: number[] = [];
    service.lines$.subscribe((lines) => emissions.push(lines.length));
    service.add(med(), 1);
    service.clear();
    expect(emissions).toEqual([0, 1, 0]);
    done();
  });
});
