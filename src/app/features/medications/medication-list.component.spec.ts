import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { MedicationListComponent } from './medication-list.component';
import { MedicationService } from './medication.service';
import { CartService } from '../sales/cart.service';
import { AuthService } from '../../core/auth/auth.service';
import { Medication, PaginatedResponse } from '../../core/models/medication.model';

const med: Medication = {
  id: 'm1',
  name: 'Ibuprofeno',
  sku: 'IBU',
  category: 'Antiinflamatorio',
  price: '1500',
  stock: 4,
  expiryDate: '2030-01-01',
  createdAt: '',
  updatedAt: '',
  isCriticalStock: true,
  isNearExpiry: false,
};

const page: PaginatedResponse<Medication> = {
  success: true,
  data: { items: [med], total: 1, page: 1, limit: 10, totalPages: 1 },
};

describe('MedicationListComponent', () => {
  let fixture: ComponentFixture<MedicationListComponent>;
  let component: MedicationListComponent;
  let service: jasmine.SpyObj<MedicationService>;
  let openSpy: jasmine.Spy;
  let snack: jasmine.SpyObj<MatSnackBar>;
  let cart: CartService;

  beforeEach(() => {
    service = jasmine.createSpyObj<MedicationService>('MedicationService', [
      'getAll',
      'delete',
    ]);
    snack = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    service.getAll.and.returnValue(of(page));
    service.delete.and.returnValue(of(void 0));

    TestBed.configureTestingModule({
      imports: [MedicationListComponent],
      providers: [
        provideNoopAnimations(),
        CartService,
        { provide: MedicationService, useValue: service },
        { provide: MatSnackBar, useValue: snack },
        {
          provide: AuthService,
          useValue: {
            user$: of({ name: 'A', email: 'a@a.com', roles: ['Admin'] }),
            hasRole: () => true,
          },
        },
      ],
    });
    fixture = TestBed.createComponent(MedicationListComponent);
    component = fixture.componentInstance;
    cart = TestBed.inject(CartService);

    // MatDialog real (provisto por MatDialogModule del componente): espiar open.
    const dialog = fixture.debugElement.injector.get(MatDialog);
    openSpy = spyOn(dialog, 'open').and.returnValue({
      afterClosed: () => of(undefined),
    } as never);

    fixture.detectChanges();
  });

  it('carga el inventario al iniciar', () => {
    expect(service.getAll).toHaveBeenCalled();
    expect(component.items.length).toBe(1);
    expect(component.total).toBe(1);
  });

  it('cambia de página y recarga', () => {
    service.getAll.calls.reset();
    component.onPage({ pageIndex: 1, pageSize: 25, length: 100 });
    expect(component.pageIndex).toBe(1);
    expect(component.pageSize).toBe(25);
    expect(service.getAll).toHaveBeenCalled();
  });

  it('los filtros resetean a página 1 con debounce', fakeAsync(() => {
    component.pageIndex = 3;
    service.getAll.calls.reset();
    component.filters.controls.name.setValue('ibu');
    tick(300);
    expect(component.pageIndex).toBe(0);
    expect(service.getAll).toHaveBeenCalled();
  }));

  it('openForm recarga y avisa al guardar', () => {
    openSpy.and.returnValue({ afterClosed: () => of(true) } as never);
    service.getAll.calls.reset();
    component.openForm(med);
    expect(service.getAll).toHaveBeenCalled();
    expect(snack.open).toHaveBeenCalled();
  });

  it('confirmDelete elimina al confirmar', () => {
    openSpy.and.returnValue({ afterClosed: () => of(true) } as never);
    component.confirmDelete(med);
    expect(service.delete).toHaveBeenCalledWith('m1');
    expect(snack.open).toHaveBeenCalled();
  });

  it('no elimina si se cancela', () => {
    openSpy.and.returnValue({ afterClosed: () => of(false) } as never);
    component.confirmDelete(med);
    expect(service.delete).not.toHaveBeenCalled();
  });

  it('addToCart agrega al carrito con la cantidad elegida', () => {
    openSpy.and.returnValue({ afterClosed: () => of(2) } as never);
    component.addToCart(med);
    expect(cart.lines.length).toBe(1);
    expect(cart.lines[0].quantity).toBe(2);
    expect(snack.open).toHaveBeenCalled();
  });

  it('addToCart no hace nada si se cancela', () => {
    openSpy.and.returnValue({ afterClosed: () => of(undefined) } as never);
    component.addToCart(med);
    expect(cart.lines.length).toBe(0);
  });
});
