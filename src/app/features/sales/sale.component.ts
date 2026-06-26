import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import { MedicationService } from '../medications/medication.service';
import { SaleService } from './sale.service';
import { Medication } from '../../core/models/medication.model';
import { CartLine, CreateSaleDto } from '../../core/models/sale.model';
import { unwrap } from '../../core/utils/unwrap';
import { CartTableComponent } from './cart-table.component';
import { CartService } from './cart.service';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';

@Component({
  selector: 'app-sale',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    CartTableComponent,
    CurrencyCopPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="page-title">Ventas</h1>

    <mat-card class="picker-card">
      <div class="picker-row">
        <mat-form-field appearance="outline" class="search">
          <mat-label>Buscar medicamento</mat-label>
          <input
            matInput
            [formControl]="searchCtrl"
            [matAutocomplete]="auto"
            placeholder="Nombre o SKU"
          />
          <mat-spinner
            *ngIf="searching"
            matSuffix
            diameter="18"
          ></mat-spinner>
          <mat-autocomplete
            #auto="matAutocomplete"
            [displayWith]="displayMed"
            (optionSelected)="onSelect($event)"
          >
            <mat-option *ngFor="let m of results" [value]="m">
              {{ m.name }} — {{ m.sku }} (stock: {{ m.stock }})
            </mat-option>
          </mat-autocomplete>
        </mat-form-field>

        <mat-form-field appearance="outline" class="qty">
          <mat-label>Cantidad</mat-label>
          <input matInput type="number" [formControl]="quantityCtrl" />
          <mat-error *ngIf="quantityCtrl.hasError('required')">
            Requerido
          </mat-error>
          <mat-error *ngIf="quantityCtrl.hasError('min')">Mínimo 1</mat-error>
          <mat-error *ngIf="quantityCtrl.hasError('max')">
            Máx. {{ selected?.stock }}
          </mat-error>
        </mat-form-field>

        <button
          mat-raised-button
          color="primary"
          class="add-btn"
          [disabled]="!canAdd()"
          (click)="addToCart()"
        >
          <mat-icon>add_shopping_cart</mat-icon> Agregar
        </button>
      </div>

      <div *ngIf="selected" class="selected-info">
        <span><strong>{{ selected.name }}</strong></span>
        <span>Stock disponible: {{ selected.stock }}</span>
        <span>Precio unit.: {{ selectedPrice | currencyCop }}</span>
      </div>
    </mat-card>

    <mat-card class="cart-card">
      <app-cart-table
        [lines]="cart"
        (remove)="removeLine($event)"
      ></app-cart-table>

      <div class="footer">
        <div class="total">
          Total: <strong>{{ total | currencyCop }}</strong>
        </div>
        <button
          mat-raised-button
          color="primary"
          [disabled]="cart.length === 0 || processing"
          (click)="processSale()"
        >
          <mat-spinner *ngIf="processing" diameter="18"></mat-spinner>
          <span *ngIf="!processing">Procesar venta</span>
        </button>
      </div>
    </mat-card>
  `,
  styles: [
    `
      .page-title {
        margin: 0 0 16px;
      }
      .picker-card,
      .cart-card {
        padding: 20px;
        margin-bottom: 16px;
      }
      .picker-row {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .search {
        flex: 1;
        min-width: 260px;
      }
      .qty {
        width: 140px;
      }
      .add-btn {
        height: 56px;
      }
      .selected-info {
        display: flex;
        gap: 24px;
        flex-wrap: wrap;
        color: #555;
        margin-top: 4px;
      }
      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
        border-top: 1px solid #eee;
        padding-top: 12px;
      }
      .total {
        font-size: 18px;
      }
    `,
  ],
})
export class SaleComponent implements OnInit, OnDestroy {
  private readonly medService = inject(MedicationService);
  private readonly saleService = inject(SaleService);
  private readonly cartService = inject(CartService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly searchCtrl = new FormControl<string | Medication>('');
  readonly quantityCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(1)],
  });

  results: Medication[] = [];
  searching = false;
  selected: Medication | null = null;
  cart: CartLine[] = [];
  processing = false;

  get selectedPrice(): number {
    return this.selected ? parseFloat(this.selected.price) : 0;
  }

  get total(): number {
    return this.cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  }

  ngOnInit(): void {
    // El carrito es compartido: puede llenarse también desde Inventario.
    this.cartService.lines$
      .pipe(takeUntil(this.destroy$))
      .subscribe((lines) => {
        this.cart = lines;
        this.cdr.markForCheck();
      });

    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((v): v is string => typeof v === 'string'),
        switchMap((q) => {
          const term = q.trim();
          if (term.length < 1) {
            this.results = [];
            return [];
          }
          this.searching = true;
          this.cdr.markForCheck();
          return this.medService.search(term);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res) => {
          this.results = unwrap<Medication[]>(res) ?? [];
          this.searching = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.results = [];
          this.searching = false;
          this.cdr.markForCheck();
        },
      });
  }

  displayMed(med: Medication | string | null): string {
    if (!med || typeof med === 'string') {
      return typeof med === 'string' ? med : '';
    }
    return `${med.name} — ${med.sku}`;
  }

  onSelect(event: MatAutocompleteSelectedEvent): void {
    this.selected = event.option.value as Medication;
    this.quantityCtrl.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(this.selected.stock),
    ]);
    this.quantityCtrl.setValue(1);
    this.quantityCtrl.updateValueAndValidity();
  }

  canAdd(): boolean {
    return !!this.selected && this.quantityCtrl.valid;
  }

  addToCart(): void {
    if (!this.selected || this.quantityCtrl.invalid) {
      return;
    }
    const qty = Number(this.quantityCtrl.value);
    const result = this.cartService.add(this.selected, qty);
    if (!result.ok) {
      this.toast(result.message ?? 'No se pudo agregar', 'snack-error');
      return;
    }
    this.resetPicker();
  }

  private resetPicker(): void {
    this.selected = null;
    this.results = [];
    this.searchCtrl.setValue('');
    this.quantityCtrl.reset();
    this.quantityCtrl.setValidators([Validators.required, Validators.min(1)]);
    this.quantityCtrl.updateValueAndValidity();
  }

  removeLine(index: number): void {
    this.cartService.removeAt(index);
  }

  processSale(): void {
    if (this.cart.length === 0 || this.processing) {
      return;
    }
    this.processing = true;
    const dto: CreateSaleDto = {
      items: this.cart.map((l) => ({
        medicationId: l.medicationId,
        quantity: l.quantity,
      })),
    };

    this.saleService.processSale(dto).subscribe({
      next: () => {
        this.processing = false;
        this.toast('Venta registrada exitosamente', 'snack-success');
        this.cartService.clear();
        this.resetPicker();
        this.cdr.markForCheck();
      },
      error: (err: HttpErrorResponse) => {
        this.processing = false;
        const msg =
          err.error?.error?.message ??
          'No se pudo procesar la venta. Intenta de nuevo.';
        this.toast(msg, 'snack-error');
        this.cdr.markForCheck();
      },
    });
  }

  private toast(message: string, panel: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: [panel],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
