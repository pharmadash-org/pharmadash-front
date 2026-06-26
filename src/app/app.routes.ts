import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { LayoutComponent } from './shared/components/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent,
      ),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'medications',
        loadComponent: () =>
          import('./features/medications/medication-list.component').then(
            (m) => m.MedicationListComponent,
          ),
      },
      {
        path: 'sales',
        loadComponent: () =>
          import('./features/sales/sale.component').then(
            (m) => m.SaleComponent,
          ),
      },
      { path: '', redirectTo: 'medications', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
