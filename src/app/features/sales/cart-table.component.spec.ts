import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CartTableComponent } from './cart-table.component';
import { CartLine } from '../../core/models/sale.model';

describe('CartTableComponent', () => {
  let fixture: ComponentFixture<CartTableComponent>;
  let component: CartTableComponent;

  const line: CartLine = {
    medicationId: 'm1',
    name: 'Ibuprofeno',
    sku: 'IBU',
    unitPrice: 1500,
    quantity: 2,
    stock: 10,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CartTableComponent],
      providers: [provideNoopAnimations()],
    });
    fixture = TestBed.createComponent(CartTableComponent);
    component = fixture.componentInstance;
  });

  it('muestra mensaje de carrito vacío', () => {
    component.lines = [];
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.empty')).not.toBeNull();
  });

  it('renderiza las líneas del carrito', () => {
    component.lines = [line];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ibuprofeno');
  });

  it('emite el índice al quitar una línea', () => {
    const spy = jasmine.createSpy('remove');
    component.remove.subscribe(spy);
    component.remove.emit(0);
    expect(spy).toHaveBeenCalledWith(0);
  });
});
