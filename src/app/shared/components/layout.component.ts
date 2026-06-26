import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { HeaderComponent } from './header.component';
import { SidebarComponent } from './sidebar.component';
import { LoadingService } from '../../core/services/loading.service';
import { StockAlertService } from '../../core/services/stock-alert.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatProgressBarModule,
    HeaderComponent,
    SidebarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="layout">
      <app-header (menuToggle)="sidenav.toggle()"></app-header>

      <mat-progress-bar
        *ngIf="loading.loading$ | async"
        mode="indeterminate"
        class="top-progress"
      ></mat-progress-bar>

      <mat-sidenav-container class="container">
        <mat-sidenav
          #sidenav
          [mode]="(isHandset$ | async) ? 'over' : 'side'"
          [opened]="!(isHandset$ | async)"
          class="sidenav"
        >
          <app-sidebar
            (navigate)="closeOnHandset(sidenav)"
          ></app-sidebar>
        </mat-sidenav>

        <mat-sidenav-content class="content">
          <router-outlet></router-outlet>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [
    `
      .layout {
        display: flex;
        flex-direction: column;
        height: 100vh;
      }
      .top-progress {
        position: absolute;
        top: 64px;
        left: 0;
        right: 0;
        z-index: 9;
      }
      .container {
        flex: 1;
      }
      .sidenav {
        width: 240px;
        border-right: 1px solid #e0e0e0;
      }
      .content {
        padding: 24px;
        background: #f5f7fa;
      }
      @media (max-width: 768px) {
        .content {
          padding: 16px;
        }
      }
    `,
  ],
})
export class LayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav?: MatSidenav;
  readonly loading = inject(LoadingService);
  private readonly breakpoint = inject(BreakpointObserver);
  private readonly stockAlert = inject(StockAlertService);
  private sub?: Subscription;

  readonly isHandset$ = this.breakpoint
    .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
    .pipe(map((result) => result.matches));

  ngOnInit(): void {
    // Mantener la suscripción viva para que el async pipe del template reaccione.
    this.sub = this.isHandset$.subscribe();
    // Vigila el inventario y avisa al Admin de stock crítico / por vencer.
    this.stockAlert.start();
  }

  closeOnHandset(sidenav: MatSidenav): void {
    if (sidenav.mode === 'over') {
      sidenav.close();
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
