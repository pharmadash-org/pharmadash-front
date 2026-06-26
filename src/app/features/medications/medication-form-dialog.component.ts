import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MedicationService } from './medication.service';
import {
  CreateMedicationDto,
  MEDICATION_CATEGORIES,
  Medication,
} from '../../core/models/medication.model';
import { futureDateValidator } from '../../shared/validators/future-date.validator';

export interface MedicationDialogData {
  medication?: Medication;
}

@Component({
  selector: 'app-medication-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>
      {{ isEdit ? 'Editar medicamento' : 'Nuevo medicamento' }}
    </h2>

    <mat-progress-bar
      *ngIf="saving"
      mode="indeterminate"
    ></mat-progress-bar>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" />
          <mat-error *ngIf="form.controls.name.hasError('required')">
            El nombre es obligatorio
          </mat-error>
          <mat-error *ngIf="form.controls.name.hasError('minlength')">
            Mínimo 3 caracteres
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>SKU</mat-label>
          <input matInput formControlName="sku" />
          <mat-error *ngIf="form.controls.sku.hasError('required')">
            El SKU es obligatorio
          </mat-error>
          <mat-error *ngIf="form.controls.sku.hasError('minlength')">
            Mínimo 3 caracteres
          </mat-error>
          <mat-error *ngIf="form.controls.sku.hasError('conflict')">
            El SKU ya existe
          </mat-error>
          <mat-error *ngIf="form.controls.sku.hasError('server')">
            {{ form.controls.sku.getError('server') }}
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Categoría</mat-label>
          <mat-select formControlName="category">
            <mat-option *ngFor="let cat of categories" [value]="cat">
              {{ cat }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.controls.category.hasError('required')">
            La categoría es obligatoria
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción (opcional)</mat-label>
          <textarea matInput formControlName="description" rows="2"></textarea>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Precio</mat-label>
            <input
              matInput
              type="number"
              step="0.01"
              formControlName="price"
            />
            <span matTextPrefix>$&nbsp;</span>
            <mat-error *ngIf="form.controls.price.hasError('required')">
              El precio es obligatorio
            </mat-error>
            <mat-error *ngIf="form.controls.price.hasError('min')">
              Debe ser mayor a 0
            </mat-error>
            <mat-error *ngIf="form.controls.price.hasError('server')">
              {{ form.controls.price.getError('server') }}
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Stock</mat-label>
            <input matInput type="number" formControlName="stock" />
            <mat-error *ngIf="form.controls.stock.hasError('required')">
              El stock es obligatorio
            </mat-error>
            <mat-error *ngIf="form.controls.stock.hasError('min')">
              No puede ser negativo
            </mat-error>
            <mat-error *ngIf="form.controls.stock.hasError('integer')">
              Debe ser un número entero
            </mat-error>
            <mat-error *ngIf="form.controls.stock.hasError('server')">
              {{ form.controls.stock.getError('server') }}
            </mat-error>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Fecha de vencimiento</mat-label>
          <input
            matInput
            [matDatepicker]="picker"
            formControlName="expiryDate"
          />
          <mat-datepicker-toggle
            matIconSuffix
            [for]="picker"
          ></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          <mat-error *ngIf="form.controls.expiryDate.hasError('required')">
            La fecha es obligatoria
          </mat-error>
          <mat-error *ngIf="form.controls.expiryDate.hasError('futureDate')">
            La fecha debe ser futura
          </mat-error>
        </mat-form-field>

        <p *ngIf="generalError" class="general-error">{{ generalError }}</p>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" [mat-dialog-close]="false">
          Cancelar
        </button>
        <button
          mat-raised-button
          color="primary"
          type="submit"
          [disabled]="saving"
        >
          {{ isEdit ? 'Guardar' : 'Crear' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [
    `
      .form-grid {
        display: flex;
        flex-direction: column;
        min-width: 420px;
        max-width: 90vw;
        padding-top: 8px;
      }
      .row {
        display: flex;
        gap: 12px;
      }
      .row mat-form-field {
        flex: 1;
      }
      .general-error {
        color: var(--pharma-critical);
        margin: 0;
      }
    `,
  ],
})
export class MedicationFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MedicationService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly categories = MEDICATION_CATEGORIES;

  saving = false;
  generalError = '';
  readonly isEdit: boolean;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    sku: ['', [Validators.required, Validators.minLength(3)]],
    category: ['', [Validators.required]],
    description: [''],
    price: [
      null as number | null,
      [Validators.required, Validators.min(0.01)],
    ],
    stock: [
      null as number | null,
      [Validators.required, Validators.min(0), integerValidator],
    ],
    expiryDate: [
      null as Date | string | null,
      [Validators.required, futureDateValidator()],
    ],
  });

  constructor(
    private dialogRef: MatDialogRef<MedicationFormDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: MedicationDialogData,
  ) {
    this.isEdit = !!data?.medication;
    if (data?.medication) {
      const m = data.medication;
      this.form.patchValue({
        name: m.name,
        sku: m.sku,
        category: m.category,
        description: m.description ?? '',
        price: parseFloat(m.price),
        stock: m.stock,
        expiryDate: new Date(m.expiryDate),
      });
    }

    // Limpiar errores de servidor al editar el campo.
    this.form.controls.sku.valueChanges.subscribe(() =>
      this.clearServerErrors(this.form.controls.sku),
    );
  }

  submit(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.generalError = '';

    const raw = this.form.getRawValue();
    const dto: CreateMedicationDto = {
      name: raw.name,
      sku: raw.sku,
      category: raw.category as CreateMedicationDto['category'],
      description: raw.description || undefined,
      price: Number(raw.price),
      stock: Number(raw.stock),
      expiryDate: toIsoDate(raw.expiryDate),
    };

    const req$ = this.isEdit
      ? this.service.update(this.data.medication!.id, dto)
      : this.service.create(dto);

    req$.subscribe({
      next: () => {
        this.saving = false;
        this.dialogRef.close(true);
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.handleError(err);
        this.cdr.markForCheck();
      },
    });
  }

  private handleError(err: HttpErrorResponse): void {
    const apiError = err.error?.error;
    if (err.status === 409) {
      this.form.controls.sku.setErrors({ conflict: true });
      return;
    }
    if (err.status === 400 && Array.isArray(apiError?.details)) {
      for (const detail of apiError.details) {
        const ctrl = detail.field
          ? (this.form.get(detail.field) as
              | import('@angular/forms').AbstractControl
              | null)
          : null;
        if (ctrl) {
          ctrl.setErrors({ server: detail.message });
        } else {
          this.generalError = detail.message;
        }
      }
      return;
    }
    this.generalError =
      apiError?.message ?? 'Ocurrió un error al guardar el medicamento.';
  }

  private clearServerErrors(
    ctrl: import('@angular/forms').AbstractControl,
  ): void {
    if (ctrl.hasError('conflict') || ctrl.hasError('server')) {
      const errors = { ...ctrl.errors };
      delete errors['conflict'];
      delete errors['server'];
      ctrl.setErrors(Object.keys(errors).length ? errors : null);
    }
  }
}

function integerValidator(control: {
  value: unknown;
}): { integer: true } | null {
  const v = control.value;
  if (v === null || v === undefined || v === '') {
    return null;
  }
  return Number.isInteger(Number(v)) ? null : { integer: true };
}

/**
 * Devuelve un ISO 8601 completo (lo que espera el backend) pero fijando la
 * medianoche UTC del día LOCAL elegido. Así se preserva el día seleccionado
 * sin el desfase que produce toISOString() en zonas horarias negativas.
 */
function toIsoDate(value: Date | string | null): string {
  if (!value) {
    return '';
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
  ).toISOString();
}
