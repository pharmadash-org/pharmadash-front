import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CartLine } from '../../core/models/sale.model';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';

@Component({
  selector: 'app-cart-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    CurrencyCopPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <table mat-table [dataSource]="lines" class="cart">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Medicamento</th>
        <td mat-cell *matCellDef="let l">
          {{ l.name }} <small class="sku">({{ l.sku }})</small>
        </td>
      </ng-container>

      <ng-container matColumnDef="quantity">
        <th mat-header-cell *matHeaderCellDef>Cantidad</th>
        <td mat-cell *matCellDef="let l">{{ l.quantity }}</td>
      </ng-container>

      <ng-container matColumnDef="unitPrice">
        <th mat-header-cell *matHeaderCellDef>Precio Unit.</th>
        <td mat-cell *matCellDef="let l">{{ l.unitPrice | currencyCop }}</td>
      </ng-container>

      <ng-container matColumnDef="subtotal">
        <th mat-header-cell *matHeaderCellDef>Subtotal</th>
        <td mat-cell *matCellDef="let l">
          {{ l.unitPrice * l.quantity | currencyCop }}
        </td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let l; let i = index">
          <button
            mat-icon-button
            color="warn"
            (click)="remove.emit(i)"
            aria-label="Quitar"
          >
            <mat-icon>delete</mat-icon>
          </button>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>

    <p *ngIf="lines.length === 0" class="empty">El carrito está vacío.</p>
  `,
  styles: [
    `
      .cart {
        width: 100%;
      }
      .sku {
        color: #999;
      }
      .empty {
        text-align: center;
        color: #999;
        padding: 24px 0;
      }
    `,
  ],
})
export class CartTableComponent {
  @Input() lines: CartLine[] = [];
  @Output() remove = new EventEmitter<number>();

  readonly columns = ['name', 'quantity', 'unitPrice', 'subtotal', 'actions'];
}
