import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { MedicationService } from './medication.service';
import {
  MEDICATION_CATEGORIES,
  Medication,
} from '../../core/models/medication.model';
import {
  MedicationFormDialogComponent,
  MedicationDialogData,
} from './medication-form-dialog.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog.component';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';
import { CartService } from '../sales/cart.service';
import { AddToCartDialogComponent } from '../sales/add-to-cart-dialog.component';

@Component({
  selector: 'app-medication-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    HasRoleDirective,
    CurrencyCopPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="header-row">
      <h1 class="page-title">Inventario</h1>
      <button
        *appHasRole="['Admin']"
        mat-raised-button
        color="primary"
        (click)="openForm()"
      >
        <mat-icon>add</mat-icon> Nuevo medicamento
      </button>
    </div>

    <form [formGroup]="filters" class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Buscar por nombre</mat-label>
        <input matInput formControlName="name" />
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Categoría</mat-label>
        <mat-select formControlName="category">
          <mat-option [value]="''">Todas</mat-option>
          <mat-option *ngFor="let cat of categories" [value]="cat">
            {{ cat }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </form>

    <div class="table-card">
      <div *ngIf="loading" class="spinner">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <table mat-table [dataSource]="items" [hidden]="loading">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nombre</th>
          <td mat-cell *matCellDef="let m">{{ m.name }}</td>
        </ng-container>

        <ng-container matColumnDef="sku">
          <th mat-header-cell *matHeaderCellDef>SKU</th>
          <td mat-cell *matCellDef="let m">{{ m.sku }}</td>
        </ng-container>

        <ng-container matColumnDef="category">
          <th mat-header-cell *matHeaderCellDef>Categoría</th>
          <td mat-cell *matCellDef="let m">{{ m.category }}</td>
        </ng-container>

        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef>Precio</th>
          <td mat-cell *matCellDef="let m">{{ m.price | currencyCop }}</td>
        </ng-container>

        <ng-container matColumnDef="stock">
          <th mat-header-cell *matHeaderCellDef>Stock</th>
          <td mat-cell *matCellDef="let m">{{ m.stock }}</td>
        </ng-container>

        <ng-container matColumnDef="expiryDate">
          <th mat-header-cell *matHeaderCellDef>Vencimiento</th>
          <td mat-cell *matCellDef="let m">
            {{ m.expiryDate | date: 'dd/MM/yyyy' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let m">
            <span *ngIf="m.isCriticalStock" class="badge badge-critical">
              Stock Crítico
            </span>
            <span *ngIf="m.isNearExpiry" class="badge badge-warning">
              Próximo a vencer
            </span>
            <span
              *ngIf="!m.isCriticalStock && !m.isNearExpiry"
              class="badge badge-ok"
            >
              OK
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Acciones</th>
          <td mat-cell *matCellDef="let m">
            <button
              mat-icon-button
              color="accent"
              matTooltip="Agregar a venta"
              [disabled]="m.stock < 1"
              (click)="addToCart(m)"
            >
              <mat-icon>add_shopping_cart</mat-icon>
            </button>
            <ng-container *appHasRole="['Admin']">
              <button
                mat-icon-button
                color="primary"
                matTooltip="Editar"
                (click)="openForm(m)"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                color="warn"
                matTooltip="Eliminar"
                (click)="confirmDelete(m)"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </ng-container>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr
          mat-row
          *matRowDef="let row; columns: columns"
          [class.row-critical]="row.isCriticalStock"
          [class.row-expiring]="row.isNearExpiry"
        ></tr>
      </table>

      <p *ngIf="!loading && items.length === 0" class="empty">
        No se encontraron medicamentos.
      </p>

      <mat-paginator
        [length]="total"
        [pageSize]="pageSize"
        [pageIndex]="pageIndex"
        [pageSizeOptions]="[10, 25, 50]"
        (page)="onPage($event)"
      ></mat-paginator>
    </div>
  `,
  styles: [
    `
      .header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .page-title {
        margin: 0;
      }
      .filters {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }
      .filters mat-form-field {
        min-width: 240px;
      }
      .table-card {
        background: #fff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        position: relative;
      }
      table {
        width: 100%;
      }
      .spinner {
        display: flex;
        justify-content: center;
        padding: 48px 0;
      }
      .empty {
        text-align: center;
        color: #999;
        padding: 32px 0;
      }
      .badge + .badge {
        margin-left: 4px;
      }
      .readonly {
        color: #bbb;
      }
    `,
  ],
})
export class MedicationListComponent implements OnInit, OnDestroy {
  private readonly service = inject(MedicationService);
  private readonly cart = inject(CartService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  readonly categories = MEDICATION_CATEGORIES;
  readonly columns = [
    'name',
    'sku',
    'category',
    'price',
    'stock',
    'expiryDate',
    'status',
    'actions',
  ];

  items: Medication[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 10;
  loading = false;

  readonly filters = this.fb.nonNullable.group({
    name: '',
    category: '',
  });

  ngOnInit(): void {
    this.filters.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(this.sameFilters), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0; // resetear a página 1 al cambiar filtros
        this.load();
      });
    this.load();
  }

  private sameFilters(
    a: Partial<{ name: string; category: string }>,
    b: Partial<{ name: string; category: string }>,
  ): boolean {
    return a.name === b.name && a.category === b.category;
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  load(): void {
    this.loading = true;
    const { name, category } = this.filters.getRawValue();
    this.service
      .getAll({
        page: this.pageIndex + 1,
        limit: this.pageSize,
        name: name || undefined,
        category: category || undefined,
      })
      .subscribe({
        next: (res) => {
          this.items = res.data.items;
          this.total = res.data.total;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.items = [];
          this.total = 0;
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  addToCart(medication: Medication): void {
    const ref = this.dialog.open(AddToCartDialogComponent, {
      data: medication,
      width: '360px',
    });
    ref.afterClosed().subscribe((qty?: number) => {
      if (!qty) {
        return;
      }
      const result = this.cart.add(medication, qty);
      this.toast(
        result.ok
          ? `Agregado a la venta: ${qty} × ${medication.name}`
          : (result.message ?? 'No se pudo agregar'),
        result.ok ? 'snack-success' : 'snack-error',
      );
    });
  }

  openForm(medication?: Medication): void {
    const ref = this.dialog.open(MedicationFormDialogComponent, {
      data: { medication } as MedicationDialogData,
      width: '520px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((saved) => {
      if (saved) {
        this.toast(
          medication ? 'Medicamento actualizado' : 'Medicamento creado',
          'snack-success',
        );
        this.load();
      }
    });
  }

  confirmDelete(medication: Medication): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar medicamento',
        message: `¿Eliminar "${medication.name}" (${medication.sku})? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        danger: true,
      } as ConfirmDialogData,
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.service.delete(medication.id).subscribe({
          next: () => {
            this.toast('Medicamento eliminado', 'snack-success');
            // Si la página queda vacía, retroceder una página.
            if (this.items.length === 1 && this.pageIndex > 0) {
              this.pageIndex--;
            }
            this.load();
          },
          error: () => this.toast('No se pudo eliminar', 'snack-error'),
        });
      }
    });
  }

  private toast(message: string, panel: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3500,
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
