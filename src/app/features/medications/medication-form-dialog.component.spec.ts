import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import {
  MedicationDialogData,
  MedicationFormDialogComponent,
} from './medication-form-dialog.component';
import { MedicationService } from './medication.service';
import { Medication } from '../../core/models/medication.model';

const existing: Medication = {
  id: 'm1',
  name: 'Ibuprofeno',
  sku: 'IBU-400',
  category: 'Antiinflamatorio',
  description: 'desc',
  price: '1500.50',
  stock: 10,
  expiryDate: '2030-01-01',
  createdAt: '',
  updatedAt: '',
  isCriticalStock: false,
  isNearExpiry: false,
};

describe('MedicationFormDialogComponent', () => {
  let fixture: ComponentFixture<MedicationFormDialogComponent>;
  let component: MedicationFormDialogComponent;
  let service: jasmine.SpyObj<MedicationService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<MedicationFormDialogComponent>>;

  function createWith(data: MedicationDialogData): void {
    TestBed.configureTestingModule({
      imports: [MedicationFormDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MedicationService, useValue: service },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    });
    fixture = TestBed.createComponent(MedicationFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function fillValid(): void {
    const future = new Date();
    future.setDate(future.getDate() + 40);
    component.form.patchValue({
      name: 'Paracetamol',
      sku: 'PAR-500',
      category: 'Analgesico',
      description: '',
      price: 1200,
      stock: 30,
      expiryDate: future,
    });
  }

  beforeEach(() => {
    service = jasmine.createSpyObj<MedicationService>('MedicationService', [
      'create',
      'update',
    ]);
    dialogRef = jasmine.createSpyObj<
      MatDialogRef<MedicationFormDialogComponent>
    >('MatDialogRef', ['close']);
  });

  it('modo creación: formulario inválido no envía', () => {
    createWith({});
    expect(component.isEdit).toBeFalse();
    component.submit();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('crea cuando el formulario es válido', () => {
    service.create.and.returnValue(of({ success: true, data: existing }));
    createWith({});
    fillValid();
    component.submit();
    expect(service.create).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('409 marca el SKU como duplicado', () => {
    service.create.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { error: { code: 'CONFLICT', message: 'dup' } },
          }),
      ),
    );
    createWith({});
    fillValid();
    component.submit();
    expect(component.form.controls.sku.hasError('conflict')).toBeTrue();
  });

  it('400 coloca los errores por campo', () => {
    service.create.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'inválido',
                details: [{ field: 'name', message: 'Nombre inválido' }],
              },
            },
          }),
      ),
    );
    createWith({});
    fillValid();
    component.submit();
    expect(component.form.controls.name.getError('server')).toBe(
      'Nombre inválido',
    );
  });

  it('modo edición: precarga datos y llama a update', () => {
    service.update.and.returnValue(of({ success: true, data: existing }));
    createWith({ medication: existing });
    expect(component.isEdit).toBeTrue();
    expect(component.form.controls.name.value).toBe('Ibuprofeno');
    expect(component.form.controls.price.value).toBe(1500.5);
    component.submit();
    expect(service.update).toHaveBeenCalledWith('m1', jasmine.any(Object));
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });
});
