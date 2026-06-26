import { Injectable, OnDestroy, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { DashboardService } from '../../features/dashboard/dashboard.service';

/**
 * Vigila el inventario y avisa SOLO al rol Admin cuando hay productos en stock
 * crítico o próximos a vencer, para mantener un buen flujo de reabastecimiento.
 * El backend sigue siendo la fuente de verdad: aquí solo se notifica.
 */
@Injectable({ providedIn: 'root' })
export class StockAlertService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly dashboard = inject(DashboardService);
  private readonly snack = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();
  private notified = false;

  /** Empieza a vigilar la sesión: al entrar un Admin, comprueba el stock una vez. */
  start(): void {
    this.auth.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (!user) {
        this.notified = false; // sesión cerrada: permitir avisar de nuevo al volver
        return;
      }
      if (user.roles.includes('Admin')) {
        this.check();
      }
    });
  }

  /** Pide los KPIs y, si hay stock crítico o por vencer, lanza la notificación. */
  check(): void {
    if (this.notified || !this.auth.hasRole(['Admin'])) {
      return;
    }
    this.dashboard
      .getKpis()
      .pipe(
        catchError(() => of(null)),
        takeUntil(this.destroy$),
      )
      .subscribe((res) => {
        const data = res?.data;
        if (!data) {
          return;
        }
        const parts: string[] = [];
        if (data.criticalStockCount > 0) {
          parts.push(`${data.criticalStockCount} producto(s) en stock crítico`);
        }
        if (data.nearExpiryCount > 0) {
          parts.push(`${data.nearExpiryCount} producto(s) por vencer`);
        }
        if (parts.length === 0) {
          return;
        }
        this.notified = true;
        this.snack.open(
          `⚠️ Atención: ${parts.join(' y ')}. Reabastece para mantener el inventario.`,
          'Entendido',
          {
            duration: 10000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: 'stock-alert-snack',
          },
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
