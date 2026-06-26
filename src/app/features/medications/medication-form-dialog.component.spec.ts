import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import {
  MedicationDialogData,
  MedicationFormDialogComponent,
  integerValidator,
  toIsoDate,
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
    // El spinner debe soltarse tras el 409 (no quedarse "cargando").
    expect(component.saving).toBeFalse();
  });

  it('un error genérico (500) muestra mensaje general y libera el spinner', () => {
    service.create.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            error: { error: { code: 'X', message: 'Error interno' } },
          }),
      ),
    );
    createWith({});
    fillValid();
    component.submit();
    expect(component.generalError).toBe('Error interno');
    expect(component.saving).toBeFalse();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('no envía dos veces si ya está guardando', () => {
    service.create.and.returnValue(of({ success: true, data: existing }));
    createWith({});
    fillValid();
    component.saving = true;
    component.submit();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('envía la fecha como ISO completo preservando el día (sin desfase)', () => {
    service.create.and.returnValue(of({ success: true, data: existing }));
    createWith({});
    fillValid();
    component.form.controls.expiryDate.setValue(new Date(2030, 0, 15));
    component.submit();
    const dto = service.create.calls.mostRecent().args[0];
    expect(dto.expiryDate).toBe('2030-01-15T00:00:00.000Z');
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

  it('400 sin field deja el mensaje en el error general', () => {
    service.create.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'inválido',
                details: [{ message: 'Algo salió mal' }],
              },
            },
          }),
      ),
    );
    createWith({});
    fillValid();
    component.submit();
    expect(component.generalError).toBe('Algo salió mal');
  });

  it('limpia el error de servidor del SKU al volver a escribir', () => {
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
    // Al escribir un SKU válido, se limpia el conflict (queda sin errores).
    component.form.controls.sku.setValue('NUEVO-SKU');
    expect(component.form.controls.sku.hasError('conflict')).toBeFalse();
    expect(component.form.controls.sku.valid).toBeTrue();
  });

  it('mantiene otros errores al limpiar el de servidor del SKU', () => {
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
    // SKU vacío: se quita el conflict pero permanece el required.
    component.form.controls.sku.setValue('');
    expect(component.form.controls.sku.hasError('conflict')).toBeFalse();
    expect(component.form.controls.sku.hasError('required')).toBeTrue();
  });
});

describe('integerValidator', () => {
  it('acepta enteros y vacíos, rechaza decimales', () => {
    expect(integerValidator({ value: 5 })).toBeNull();
    expect(integerValidator({ value: null })).toBeNull();
    expect(integerValidator({ value: undefined })).toBeNull();
    expect(integerValidator({ value: '' })).toBeNull();
    expect(integerValidator({ value: 1.5 })).toEqual({ integer: true });
  });
});

describe('toIsoDate', () => {
  it('convierte una fecha a ISO en medianoche UTC del día local', () => {
    expect(toIsoDate(new Date(2030, 0, 15))).toBe('2030-01-15T00:00:00.000Z');
  });

  it('devuelve cadena vacía para null o fecha inválida', () => {
    expect(toIsoDate(null)).toBe('');
    expect(toIsoDate('no-es-fecha')).toBe('');
  });

  it('parsea una fecha en string y devuelve ISO de medianoche UTC', () => {
    expect(toIsoDate('2030-06-20')).toMatch(
      /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/,
    );
  });
});
