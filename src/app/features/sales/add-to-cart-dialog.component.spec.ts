import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AddToCartDialogComponent } from './add-to-cart-dialog.component';
import { Medication } from '../../core/models/medication.model';

describe('AddToCartDialogComponent', () => {
  let fixture: ComponentFixture<AddToCartDialogComponent>;
  let component: AddToCartDialogComponent;
  let dialogRef: { close: jasmine.Spy };

  const med: Medication = {
    id: 'm1',
    name: 'Ibuprofeno',
    sku: 'IBU',
    category: 'Antiinflamatorio',
    price: '1500',
    stock: 5,
    expiryDate: '2027-01-01',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    isCriticalStock: false,
    isNearExpiry: false,
  };

  beforeEach(() => {
    dialogRef = { close: jasmine.createSpy('close') };
    TestBed.configureTestingModule({
      imports: [AddToCartDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: med },
      ],
    });
    fixture = TestBed.createComponent(AddToCartDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('inicia con cantidad 1 válida', () => {
    expect(component.qty.value).toBe(1);
    expect(component.qty.valid).toBeTrue();
  });

  it('marca inválido al superar el stock', () => {
    component.qty.setValue(10);
    expect(component.qty.hasError('max')).toBeTrue();
  });

  it('confirm cierra con la cantidad si es válida', () => {
    component.qty.setValue(3);
    component.confirm();
    expect(dialogRef.close).toHaveBeenCalledWith(3);
  });

  it('confirm no cierra si es inválido', () => {
    component.qty.setValue(0);
    component.confirm();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
