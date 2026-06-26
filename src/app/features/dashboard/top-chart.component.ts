import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { TopSoldItem } from '../../core/models/kpi.model';

@Component({
  selector: 'app-top-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart-host">
      <canvas
        baseChart
        type="bar"
        [data]="barData"
        [options]="barOptions"
      ></canvas>
      <p *ngIf="!items?.length" class="empty">Sin datos de ventas todavía.</p>
    </div>
  `,
  styles: [
    `
      .chart-host {
        position: relative;
        height: 340px;
      }
      .empty {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
      }
    `,
  ],
})
export class TopChartComponent implements OnChanges {
  @Input() items: TopSoldItem[] = [];

  barData: ChartData<'bar'> = { labels: [], datasets: [] };

  readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { title: { display: true, text: 'Medicamento' } },
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Cantidad vendida' },
        ticks: { precision: 0 },
      },
    },
  };

  ngOnChanges(): void {
    const data = this.items ?? [];
    this.barData = {
      labels: data.map((i) => i.name),
      datasets: [
        {
          data: data.map((i) => i.totalQuantity),
          label: 'Cantidad vendida',
          backgroundColor: '#1565C0',
          borderRadius: 4,
          maxBarThickness: 56,
        },
      ],
    };
  }
}
