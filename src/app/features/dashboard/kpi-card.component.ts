import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

export type KpiTone = 'primary' | 'critical' | 'warning';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="kpi" [ngClass]="'tone-' + tone">
      <div class="icon-box">
        <mat-icon>{{ icon }}</mat-icon>
      </div>
      <div class="body">
        <span class="label">{{ title }}</span>
        <span class="value">{{ value }}</span>
        <span *ngIf="badge" class="badge" [ngClass]="badgeClass">
          {{ badge }}
        </span>
      </div>
    </mat-card>
  `,
  styles: [
    `
      .kpi {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        text-align: left;
        gap: 16px;
        padding: 20px;
      }
      .icon-box {
        flex: 0 0 auto;
      }
      .icon-box {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .icon-box mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: #fff;
      }
      .body {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
      .badge {
        align-self: flex-start;
      }
      .label {
        color: #666;
        font-size: 13px;
      }
      .value {
        font-size: 26px;
        font-weight: 600;
      }
      .tone-primary .icon-box {
        background: var(--pharma-primary);
      }
      .tone-critical .icon-box {
        background: var(--pharma-critical);
      }
      .tone-warning .icon-box {
        background: var(--pharma-warning);
      }
    `,
  ],
})
export class KpiCardComponent {
  @Input() title = '';
  @Input() value: string | number = '';
  @Input() icon = 'insights';
  @Input() tone: KpiTone = 'primary';
  @Input() badge?: string;

  get badgeClass(): string {
    switch (this.tone) {
      case 'critical':
        return 'badge-critical';
      case 'warning':
        return 'badge-warning';
      default:
        return 'badge-ok';
    }
  }
}
