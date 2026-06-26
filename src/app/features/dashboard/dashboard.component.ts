import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { DashboardService } from './dashboard.service';
import { MedicationService } from '../medications/medication.service';
import { KpiCardComponent } from './kpi-card.component';
import { TopChartComponent } from './top-chart.component';
import { CurrencyCopPipe } from '../../shared/pipes/currency-cop.pipe';
import { KpiResponse, TopSoldItem } from '../../core/models/kpi.model';
import { Medication } from '../../core/models/medication.model';
import { unwrap } from '../../core/utils/unwrap';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatIconModule,
    KpiCardComponent,
    TopChartComponent,
    CurrencyCopPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="page-title">Dashboard</h1>

    <div *ngIf="loading" class="spinner">
      <mat-spinner diameter="48"></mat-spinner>
    </div>

    <ng-container *ngIf="!loading">
      <div class="kpis">
        <app-kpi-card
          title="Ingresos del día"
          [value]="(kpis?.dailyRevenue | currencyCop) ?? ''"
          icon="payments"
          tone="primary"
        ></app-kpi-card>

        <app-kpi-card
          title="Stock crítico"
          [value]="kpis?.criticalStockCount ?? 0"
          icon="warning"
          tone="critical"
          badge="Atención"
        ></app-kpi-card>

        <app-kpi-card
          title="Vencimiento próximo"
          [value]="kpis?.nearExpiryCount ?? 0"
          icon="event_busy"
          tone="warning"
          badge="Revisar"
        ></app-kpi-card>
      </div>

      <div class="details">
        <mat-expansion-panel class="detail-panel" [expanded]="true">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon class="ic-critical">warning</mat-icon>
              Productos con stock crítico ({{ criticalProducts.length }})
            </mat-panel-title>
          </mat-expansion-panel-header>

          <table class="prod-table" *ngIf="criticalProducts.length; else noCrit">
            <tr>
              <th>Medicamento</th>
              <th>SKU</th>
              <th class="num">Stock</th>
            </tr>
            <tr *ngFor="let m of criticalProducts">
              <td>{{ m.name }}</td>
              <td>{{ m.sku }}</td>
              <td class="num">
                <span class="badge badge-critical">{{ m.stock }}</span>
              </td>
            </tr>
          </table>
          <ng-template #noCrit>
            <p class="empty">Sin productos en stock crítico.</p>
          </ng-template>
        </mat-expansion-panel>

        <mat-expansion-panel class="detail-panel" [expanded]="true">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon class="ic-warning">event_busy</mat-icon>
              Productos próximos a vencer ({{ nearExpiryProducts.length }})
            </mat-panel-title>
          </mat-expansion-panel-header>

          <table
            class="prod-table"
            *ngIf="nearExpiryProducts.length; else noExp"
          >
            <tr>
              <th>Medicamento</th>
              <th>SKU</th>
              <th class="num">Vence</th>
            </tr>
            <tr *ngFor="let m of nearExpiryProducts">
              <td>{{ m.name }}</td>
              <td>{{ m.sku }}</td>
              <td class="num">
                <span class="badge badge-warning">
                  {{ m.expiryDate | date: 'dd/MM/yyyy' }}
                </span>
              </td>
            </tr>
          </table>
          <ng-template #noExp>
            <p class="empty">Sin productos próximos a vencer.</p>
          </ng-template>
        </mat-expansion-panel>
      </div>

      <section class="chart-card">
        <h2>Top 5 medicamentos más vendidos</h2>
        <app-top-chart [items]="topSold"></app-top-chart>
      </section>
    </ng-container>
  `,
  styles: [
    `
      .page-title {
        margin: 0 0 20px;
      }
      .spinner {
        display: flex;
        justify-content: center;
        padding: 64px 0;
      }
      .kpis {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
      }
      .details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 16px;
        margin-top: 24px;
      }
      .detail-panel {
        border-radius: 12px !important;
      }
      .detail-panel mat-panel-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
      }
      .ic-critical {
        color: var(--pharma-critical);
      }
      .ic-warning {
        color: var(--pharma-warning);
      }
      .prod-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }
      .prod-table th,
      .prod-table td {
        text-align: left;
        padding: 8px 6px;
        border-bottom: 1px solid #f0f0f0;
      }
      .prod-table th {
        color: #888;
        font-weight: 500;
        font-size: 12px;
      }
      .prod-table .num {
        text-align: right;
        white-space: nowrap;
      }
      .empty {
        color: #999;
        margin: 8px 0;
      }
      .chart-card {
        margin-top: 24px;
        background: #fff;
        border-radius: 12px;
        padding: 20px 24px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .chart-card h2 {
        margin: 0 0 12px;
        font-size: 18px;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private readonly service = inject(DashboardService);
  private readonly medService = inject(MedicationService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  kpis: KpiResponse | null = null;
  topSold: TopSoldItem[] = [];
  criticalProducts: Medication[] = [];
  nearExpiryProducts: Medication[] = [];

  ngOnInit(): void {
    // Cada llamada es independiente: si una falla, no tumba a las demás.
    forkJoin({
      kpis: this.service.getKpis().pipe(catchError(() => of(null))),
      top: this.service.getTopSold().pipe(catchError(() => of(null))),
      // Inventario para listar CUÁLES productos están en cada estado.
      meds: this.medService
        .getAll({ page: 1, limit: 100 })
        .pipe(catchError(() => of(null))),
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe(({ kpis, top, meds }) => {
        this.kpis = kpis ? unwrap<KpiResponse>(kpis) : null;
        // RF-08: Top 5 medicamentos más vendidos.
        this.topSold = (top ? (unwrap<TopSoldItem[]>(top) ?? []) : []).slice(
          0,
          5,
        );

        const items = meds?.data?.items ?? [];
        this.criticalProducts = items.filter((m) => m.isCriticalStock);
        this.nearExpiryProducts = items.filter((m) => m.isNearExpiry);
        this.cdr.markForCheck();
      });
  }
}
