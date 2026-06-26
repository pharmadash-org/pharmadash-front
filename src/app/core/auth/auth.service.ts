import { Injectable, inject, OnDestroy } from '@angular/core';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import {
  AccountInfo,
  AuthenticationResult,
  EventMessage,
  EventType,
  InteractionStatus,
} from '@azure/msal-browser';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import {
  catchError,
  filter,
  map,
  shareReplay,
  takeUntil,
} from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AppUser } from '../models/kpi.model';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private readonly msal = inject(MsalService);
  private readonly broadcast = inject(MsalBroadcastService);
  private readonly destroy$ = new Subject<void>();

  private readonly authenticated$ = new BehaviorSubject<boolean>(false);
  private readonly userSubject$ = new BehaviorSubject<AppUser | null>(null);

  // Control de carga de roles desde el access token.
  private currentAccountId: string | null = null;
  private rolesLoaded = false;
  private rolesRequest$?: Observable<string[]>;

  readonly isAuthenticated$: Observable<boolean> =
    this.authenticated$.asObservable();
  readonly user$: Observable<AppUser | null> = this.userSubject$.asObservable();

  init(): void {
    this.broadcast.msalSubject$
      .pipe(
        filter(
          (msg: EventMessage) =>
            msg.eventType === EventType.LOGIN_SUCCESS ||
            msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS,
        ),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.syncState());

    this.broadcast.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.syncState());

    this.syncState();
  }

  private syncState(): void {
    const accounts = this.msal.instance.getAllAccounts();
    if (accounts.length === 0) {
      this.msal.instance.setActiveAccount(null);
      this.currentAccountId = null;
      this.rolesLoaded = false;
      this.rolesRequest$ = undefined;
      this.clearCachedRoles();
      this.authenticated$.next(false);
      this.userSubject$.next(null);
      return;
    }

    let active = this.msal.instance.getActiveAccount();
    if (!active) {
      active = accounts[0];
      this.msal.instance.setActiveAccount(active);
    }

    this.authenticated$.next(true);
    this.userSubject$.next(this.mapUser(active));

    // Al cambiar de cuenta, recargar los roles del access token.
    if (this.currentAccountId !== active.homeAccountId) {
      this.currentAccountId = active.homeAccountId;
      this.rolesLoaded = false;
      this.rolesRequest$ = undefined;
      this.ensureRolesLoaded().subscribe();
    }
  }

  /** Datos básicos del usuario (nombre/email del ID token). Roles llegan aparte. */
  private mapUser(account: AccountInfo): AppUser {
    const claims = (account.idTokenClaims ?? {}) as Record<string, unknown>;
    const email =
      (claims['preferred_username'] as string) ??
      (claims['email'] as string) ??
      account.username;
    const name = (claims['name'] as string) ?? account.name ?? email;
    // Roles ya cargados en memoria o, en su defecto, los últimos cacheados
    // para este usuario (evita el parpadeo Admin→vacío al recargar).
    const current = this.userSubject$.value?.roles;
    const roles =
      current && current.length
        ? current
        : this.readCachedRoles(account.homeAccountId);
    return { name, email, roles };
  }

  /**
   * Opción A: pide el access token con el scope del backend y decodifica SU
   * claim `roles` (las app roles de Entra viven en el token de la API, no en
   * el ID token del SPA). Cachea el resultado por sesión.
   */
  ensureRolesLoaded(): Observable<string[]> {
    if (this.rolesLoaded) {
      return of(this.getRoles());
    }
    if (!this.rolesRequest$) {
      this.rolesRequest$ = this.loadRoles().pipe(shareReplay(1));
    }
    return this.rolesRequest$;
  }

  private loadRoles(): Observable<string[]> {
    const account = this.msal.instance.getActiveAccount();
    if (!account) {
      return of([]);
    }
    return this.msal
      .acquireTokenSilent({
        scopes: environment.msalConfig.scopes,
        account,
      })
      .pipe(
        map((result: AuthenticationResult) =>
          this.extractRoles(result.accessToken),
        ),
        catchError((err) => {
          console.warn('No se pudieron obtener los roles del access token', err);
          return of([] as string[]);
        }),
        map((roles) => this.applyRoles(roles)),
      );
  }

  /**
   * Fija los roles del usuario actual y los persiste. Si el token no trae roles
   * (p. ej. fallo silencioso) conserva los últimos cacheados para no degradar
   * al usuario. Devuelve los roles efectivos.
   */
  private applyRoles(roles: string[]): string[] {
    this.rolesLoaded = true;
    const account = this.msal.instance.getActiveAccount();
    let finalRoles = roles;
    if (!finalRoles.length && account) {
      const cached = this.readCachedRoles(account.homeAccountId);
      if (cached.length) {
        finalRoles = cached;
      }
    }
    if (account && finalRoles.length) {
      this.writeCachedRoles(account.homeAccountId, finalRoles);
    }
    const current = this.userSubject$.value;
    if (current) {
      this.userSubject$.next({ ...current, roles: finalRoles });
    }
    return finalRoles;
  }

  // --- Caché de roles en localStorage (clave por cuenta) ---
  private rolesKey(accountId: string): string {
    return `pharmadash.roles.${accountId}`;
  }

  private readCachedRoles(accountId: string): string[] {
    try {
      const raw = localStorage.getItem(this.rolesKey(accountId));
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }

  private writeCachedRoles(accountId: string, roles: string[]): void {
    try {
      localStorage.setItem(this.rolesKey(accountId), JSON.stringify(roles));
    } catch {
      /* almacenamiento no disponible: ignorar */
    }
  }

  private clearCachedRoles(): void {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('pharmadash.roles.'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignorar */
    }
  }

  /** Decodifica el payload (base64url) de un JWT y extrae el claim `roles`. */
  private extractRoles(accessToken: string): string[] {
    try {
      const part = accessToken.split('.')[1];
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      const claims = JSON.parse(json) as Record<string, unknown>;
      return Array.isArray(claims['roles']) ? (claims['roles'] as string[]) : [];
    } catch {
      return [];
    }
  }

  /** Roles del usuario actual (claim `roles` del access token). */
  getRoles(): string[] {
    return this.userSubject$.value?.roles ?? [];
  }

  hasRole(required: string[]): boolean {
    if (!required || required.length === 0) {
      return true;
    }
    const roles = this.getRoles();
    return required.some((r) => roles.includes(r));
  }

  isLoggedIn(): boolean {
    return this.msal.instance.getAllAccounts().length > 0;
  }

  login(): void {
    this.msal.loginRedirect({ scopes: environment.msalConfig.scopes });
  }

  logout(): void {
    this.msal.logoutRedirect({
      postLogoutRedirectUri: environment.msalConfig.postLogoutRedirectUri,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
