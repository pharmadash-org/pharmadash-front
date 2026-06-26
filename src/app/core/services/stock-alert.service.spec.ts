import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { StockAlertService } from './stock-alert.service';
import { AuthService } from '../auth/auth.service';
import { DashboardService } from '../../features/dashboard/dashboard.service';
import { AppUser } from '../models/kpi.model';

function kpis(critical: number, expiry: number) {
  return of({
    success: true,
    data: {
      dailyRevenue: 0,
      criticalStockCount: critical,
      nearExpiryCount: expiry,
    },
  });
}

describe('StockAlertService', () => {
  let service: StockAlertService;
  let user$: BehaviorSubject<AppUser | null>;
  let auth: { user$: BehaviorSubject<AppUser | null>; hasRole: jasmine.Spy };
  let dashboard: jasmine.SpyObj<DashboardService>;
  let snack: jasmine.SpyObj<MatSnackBar>;

  const admin: AppUser = { name: 'A', email: 'a@a.com', roles: ['Admin'] };
  const seller: AppUser = { name: 'V', email: 'v@v.com', roles: ['Vendedor'] };

  function build(): void {
    user$ = new BehaviorSubject<AppUser | null>(null);
    auth = {
      user$,
      hasRole: jasmine
        .createSpy('hasRole')
        .and.callFake(() => (user$.value?.roles ?? []).includes('Admin')),
    };
    dashboard = jasmine.createSpyObj<DashboardService>('DashboardService', [
      'getKpis',
    ]);
    snack = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        StockAlertService,
        { provide: AuthService, useValue: auth },
        { provide: DashboardService, useValue: dashboard },
        { provide: MatSnackBar, useValue: snack },
      ],
    });
    service = TestBed.inject(StockAlertService);
  }

  beforeEach(() => build());

  it('avisa al Admin cuando hay stock crítico y por vencer', () => {
    dashboard.getKpis.and.returnValue(kpis(3, 2));
    service.start();
    user$.next(admin);
    expect(snack.open).toHaveBeenCalled();
    const msg = snack.open.calls.mostRecent().args[0] as string;
    expect(msg).toContain('3 producto(s) en stock crítico');
    expect(msg).toContain('2 producto(s) por vencer');
  });

  it('solo notifica una vez por sesión', () => {
    dashboard.getKpis.and.returnValue(kpis(1, 0));
    service.start();
    user$.next(admin);
    user$.next(admin); // segunda emisión (p. ej. roles aplicados)
    expect(snack.open).toHaveBeenCalledTimes(1);
  });

  it('no avisa a un Vendedor', () => {
    dashboard.getKpis.and.returnValue(kpis(5, 5));
    service.start();
    user$.next(seller);
    expect(dashboard.getKpis).not.toHaveBeenCalled();
    expect(snack.open).not.toHaveBeenCalled();
  });

  it('no avisa si no hay stock crítico ni por vencer', () => {
    dashboard.getKpis.and.returnValue(kpis(0, 0));
    service.start();
    user$.next(admin);
    expect(dashboard.getKpis).toHaveBeenCalled();
    expect(snack.open).not.toHaveBeenCalled();
  });

  it('avisa solo de stock crítico cuando no hay por vencer', () => {
    dashboard.getKpis.and.returnValue(kpis(4, 0));
    service.start();
    user$.next(admin);
    const msg = snack.open.calls.mostRecent().args[0] as string;
    expect(msg).toContain('stock crítico');
    expect(msg).not.toContain('por vencer');
  });

  it('un error al pedir KPIs no rompe (no notifica)', () => {
    dashboard.getKpis.and.returnValue(throwError(() => new Error('500')));
    service.start();
    user$.next(admin);
    expect(snack.open).not.toHaveBeenCalled();
  });

  it('al cerrar sesión se reinicia y vuelve a avisar al re-entrar', () => {
    dashboard.getKpis.and.returnValue(kpis(2, 0));
    service.start();
    user$.next(admin);
    expect(snack.open).toHaveBeenCalledTimes(1);
    user$.next(null); // logout → reset
    user$.next(admin); // re-login
    expect(snack.open).toHaveBeenCalledTimes(2);
  });

  it('check() ignora la llamada si no es Admin', () => {
    auth.hasRole.and.returnValue(false);
    service.check();
    expect(dashboard.getKpis).not.toHaveBeenCalled();
  });

  it('ngOnDestroy completa sin error', () => {
    expect(() => service.ngOnDestroy()).not.toThrow();
  });
});
