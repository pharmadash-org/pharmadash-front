import { Injectable, inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

/**
 * Traduce los errores HTTP del backend:
 *  401 → si NO hay sesión, redirect /login; si la hay, el backend rechazó el
 *        token (permisos/scope) → se avisa sin redirigir para evitar bucles.
 *  403 → redirect /unauthorized
 *  404 → snackbar "No encontrado"
 *  409 / 422 → se relanzan para que el componente los maneje
 *  500 → snackbar genérico
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);
  private lastAuthToast = 0;

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        switch (err.status) {
          case 401:
            this.handle401();
            break;
          case 403:
            this.router.navigate(['/unauthorized']);
            break;
          case 404:
            this.toast('No encontrado');
            break;
          case 409:
          case 422:
            // El componente (formulario / snackbar) decide cómo mostrarlo.
            break;
          case 500:
            this.toast('Error interno del servidor');
            break;
          default:
            if (err.status >= 500) {
              this.toast('Error interno del servidor');
            }
        }
        return throwError(() => err);
      }),
    );
  }

  /**
   * Si no hay cuenta MSAL, la sesión expiró → ir a login.
   * Si hay cuenta, el token fue rechazado por el backend (audience/scope/roles):
   * NO redirigir (provocaría un bucle login ⇄ ruta). Se avisa, con anti-spam.
   */
  private handle401(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    const now = Date.now();
    if (now - this.lastAuthToast > 5000) {
      this.lastAuthToast = now;
      this.toast(
        'El servidor rechazó tu sesión (401). Verifica permisos/roles de la API en Entra ID.',
      );
    }
  }

  private toast(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: ['snack-error'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
