import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { SaleComponent } from './sale.component';
import { MedicationService } from '../medications/medication.service';
import { SaleService } from './sale.service';
import { CartService } from './cart.service';
import { Medication } from '../../core/models/medication.model';

const med: Medication = {
  id: 'm1',
  name: 'Ibuprofeno',
  sku: 'IBU',
  category: 'Antiinflamatorio',
  price: '1500.50',
  stock: 5,
  expiryDate: '2030-01-01',
  createdAt: '',
  updatedAt: '',
  isCriticalStock: false,
  isNearExpiry: false,
};

describe('SaleComponent', () => {
  let fixture: ComponentFixture<SaleComponent>;
  let component: SaleComponent;
  let medService: jasmine.SpyObj<MedicationService>;
  let saleService: jasmine.SpyObj<SaleService>;
  let snack: jasmine.SpyObj<MatSnackBar>;
  let cart: CartService;

  beforeEach(() => {
    medService = jasmine.createSpyObj<MedicationService>('MedicationService', [
      'search',
    ]);
    saleService = jasmine.createSpyObj<SaleService>('SaleService', [
      'processSale',
    ]);
    snack = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    medService.search.and.returnValue(of({ success: true, data: [med] }));

    TestBed.configureTestingModule({
      imports: [SaleComponent],
      providers: [
        provideNoopAnimations(),
        CartService,
        { provide: MedicationService, useValue: medService },
        { provide: SaleService, useValue: saleService },
        { provide: MatSnackBar, useValue: snack },
      ],
    });
    fixture = TestBed.createComponent(SaleComponent);
    component = fixture.componentInstance;
    cart = TestBed.inject(CartService);
    fixture.detectChanges();
  });

  function select(): void {
    component.onSelect({ option: { value: med } } as never);
  }

  it('busca con debounce y llena resultados', fakeAsync(() => {
    component.searchCtrl.setValue('ibu');
    tick(300);
    expect(medService.search).toHaveBeenCalledWith('ibu');
    expect(component.results.length).toBe(1);
  }));

  it('selecciona un medicamento y expone precio', () => {
    select();
    expect(component.selected).toBe(med);
    expect(component.selectedPrice).toBe(1500.5);
    expect(component.canAdd()).toBeTrue();
  });

  it('agrega al carrito y calcula total', () => {
    select();
    component.quantityCtrl.setValue(2);
    component.addToCart();
    expect(cart.lines.length).toBe(1);
    expect(component.total).toBe(3001);
    expect(component.selected).toBeNull();
  });

  it('avisa si supera el stock al agregar', () => {
    select();
    component.quantityCtrl.setValidators([]);
    component.quantityCtrl.setValue(99);
    component.addToCart();
    expect(snack.open).toHaveBeenCalled();
    expect(cart.lines.length).toBe(0);
  });

  it('quita una línea', () => {
    cart.add(med, 1);
    fixture.detectChanges();
    component.removeLine(0);
    expect(cart.lines.length).toBe(0);
  });

  it('procesa la venta con éxito y limpia el carrito', () => {
    cart.add(med, 1);
    saleService.processSale.and.returnValue(of({ success: true, data: {} }));
    component.processSale();
    expect(saleService.processSale).toHaveBeenCalled();
    expect(cart.lines.length).toBe(0);
  });

  it('muestra error del backend al procesar', () => {
    cart.add(med, 1);
    saleService.processSale.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: { error: { code: 'X', message: 'Insufficient stock' } },
          }),
      ),
    );
    component.processSale();
    expect(snack.open).toHaveBeenCalled();
    expect(cart.lines.length).toBe(1);
  });

  it('displayMed formatea o devuelve vacío', () => {
    expect(component.displayMed(med)).toContain('Ibuprofeno');
    expect(component.displayMed('texto')).toBe('texto');
    expect(component.displayMed(null)).toBe('');
  });
});
