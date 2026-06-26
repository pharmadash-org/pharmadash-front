import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

/**
 * Guard de autenticación: delega en el MsalGuard de la librería, que dispara
 * el login por redirect cuando no hay sesión activa.
 */
export const authGuard: CanActivateFn = (route, state) =>
  inject(MsalGuard).canActivate(route, state);
