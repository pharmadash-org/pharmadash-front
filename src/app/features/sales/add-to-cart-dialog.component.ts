import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Medication } from '../../core/models/medication.model';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';

@Component({
  selector: 'app-add-to-cart-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    CurrencyCopPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Agregar a venta</h2>
    <mat-dialog-content>
      <p class="med">
        <strong>{{ data.name }}</strong> ({{ data.sku }})
      </p>
      <p class="meta">
        Stock disponible: {{ data.stock }} · Precio:
        {{ data.price | currencyCop }}
      </p>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Cantidad</mat-label>
        <input matInput type="number" [formControl]="qty" />
        <mat-error *ngIf="qty.hasError('required')">Requerido</mat-error>
        <mat-error *ngIf="qty.hasError('min')">Mínimo 1</mat-error>
        <mat-error *ngIf="qty.hasError('max')">Máx. {{ data.stock }}</mat-error>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="undefined">Cancelar</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="qty.invalid"
        (click)="confirm()"
      >
        Agregar
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
      }
      .med {
        margin: 0 0 4px;
      }
      .meta {
        margin: 0 0 16px;
        color: #666;
        font-size: 13px;
      }
    `,
  ],
})
export class AddToCartDialogComponent {
  readonly qty: FormControl<number>;

  constructor(
    private dialogRef: MatDialogRef<AddToCartDialogComponent, number>,
    @Inject(MAT_DIALOG_DATA) public data: Medication,
  ) {
    this.qty = new FormControl(1, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(1),
        Validators.max(data.stock),
      ],
    });
  }

  confirm(): void {
    if (this.qty.valid) {
      this.dialogRef.close(this.qty.value);
    }
  }
}
