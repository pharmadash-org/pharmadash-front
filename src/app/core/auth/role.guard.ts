import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

/**
 * Guard de autorización por rol. Las rutas declaran los roles permitidos en
 * `data.roles`. Espera a que los roles del access token estén cargados antes
 * de decidir; si el usuario no posee ninguno, redirige a /unauthorized.
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const required = (route.data?.['roles'] as string[] | undefined) ?? [];

  return auth.ensureRolesLoaded().pipe(
    map((roles) => {
      const allowed =
        required.length === 0 || required.some((r) => roles.includes(r));
      return allowed ? true : router.createUrlTree(['/unauthorized']);
    }),
  );
};
