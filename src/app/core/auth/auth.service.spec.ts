import { TestBed } from '@angular/core/testing';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import {
  AccountInfo,
  AuthenticationResult,
  EventMessage,
  EventType,
  InteractionStatus,
} from '@azure/msal-browser';
import { Subject, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

function makeAccount(homeAccountId = 'h1'): AccountInfo {
  return {
    homeAccountId,
    environment: 'e',
    tenantId: 't',
    username: 'jdoe@pharma.com',
    localAccountId: 'l',
    name: 'John Doe',
    idTokenClaims: {
      name: 'John Doe',
      preferred_username: 'jdoe@pharma.com',
    },
  } as unknown as AccountInfo;
}

// Construye un JWT (header.payload.signature) con el claim roles indicado.
function makeJwt(roles: string[]): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ roles }));
  return `${header}.${payload}.`;
}

function tokenResult(roles: string[]): AuthenticationResult {
  return { accessToken: makeJwt(roles) } as AuthenticationResult;
}

describe('AuthService', () => {
  let service: AuthService;
  let instance: jasmine.SpyObj<{
    getAllAccounts: () => AccountInfo[];
    getActiveAccount: () => AccountInfo | null;
    setActiveAccount: (a: AccountInfo | null) => void;
  }>;
  let msal: jasmine.SpyObj<MsalService>;
  let msalSubject$: Subject<EventMessage>;
  let inProgress$: Subject<InteractionStatus>;

  beforeEach(() => {
    localStorage.clear();
    instance = jasmine.createSpyObj('instance', [
      'getAllAccounts',
      'getActiveAccount',
      'setActiveAccount',
    ]);
    instance.getAllAccounts.and.returnValue([]);
    instance.getActiveAccount.and.returnValue(null);

    msal = jasmine.createSpyObj<MsalService>(
      'MsalService',
      ['loginRedirect', 'logoutRedirect', 'acquireTokenSilent'],
      { instance: instance as never },
    );
    msal.acquireTokenSilent.and.returnValue(of(tokenResult([])));

    msalSubject$ = new Subject<EventMessage>();
    inProgress$ = new Subject<InteractionStatus>();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: MsalService, useValue: msal },
        {
          provide: MsalBroadcastService,
          useValue: { msalSubject$, inProgress$ },
        },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('sin cuentas: no autenticado y usuario null', (done) => {
    service.init();
    service.isAuthenticated$.subscribe((auth) => {
      expect(auth).toBeFalse();
      done();
    });
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.getRoles()).toEqual([]);
  });

  it('con cuenta Admin: lee los roles del access token', () => {
    const account = makeAccount();
    instance.getAllAccounts.and.returnValue([account]);
    instance.getActiveAccount.and.returnValue(account);
    msal.acquireTokenSilent.and.returnValue(of(tokenResult(['Admin'])));

    service.init();

    expect(msal.acquireTokenSilent).toHaveBeenCalledWith({
      scopes: environment.msalConfig.scopes,
      account,
    });
    expect(service.getRoles()).toEqual(['Admin']);
    expect(service.hasRole(['Admin'])).toBeTrue();
    expect(service.hasRole(['Vendedor'])).toBeFalse();
    expect(service.hasRole([])).toBeTrue();
  });

  it('ensureRolesLoaded cachea el resultado (no re-pide token)', () => {
    const account = makeAccount();
    instance.getAllAccounts.and.returnValue([account]);
    instance.getActiveAccount.and.returnValue(account);
    msal.acquireTokenSilent.and.returnValue(of(tokenResult(['Vendedor'])));

    service.init();
    const callsAfterInit = msal.acquireTokenSilent.calls.count();

    service.ensureRolesLoaded().subscribe((roles) =>
      expect(roles).toEqual(['Vendedor']),
    );
    expect(msal.acquireTokenSilent.calls.count()).toBe(callsAfterInit);
  });

  it('si acquireTokenSilent falla, los roles quedan vacíos', () => {
    const account = makeAccount();
    instance.getAllAccounts.and.returnValue([account]);
    instance.getActiveAccount.and.returnValue(account);
    msal.acquireTokenSilent.and.returnValue(
      throwError(() => new Error('interaction_required')),
    );

    expect(() => service.init()).not.toThrow();
    expect(service.getRoles()).toEqual([]);
  });

  it('reacciona al evento LOGIN_SUCCESS del broadcast', () => {
    instance.getAllAccounts.and.returnValue([]);
    service.init();
    expect(service.getRoles()).toEqual([]);

    const account = makeAccount('h2');
    instance.getAllAccounts.and.returnValue([account]);
    instance.getActiveAccount.and.returnValue(account);
    msal.acquireTokenSilent.and.returnValue(of(tokenResult(['Vendedor'])));

    msalSubject$.next({ eventType: EventType.LOGIN_SUCCESS } as EventMessage);

    expect(service.hasRole(['Vendedor'])).toBeTrue();
  });

  it('sincroniza al finalizar la interacción (inProgress None)', () => {
    const account = makeAccount();
    service.init();
    instance.getAllAccounts.and.returnValue([account]);
    instance.getActiveAccount.and.returnValue(account);
    inProgress$.next(InteractionStatus.None);
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('login delega en loginRedirect con los scopes', () => {
    service.login();
    expect(msal.loginRedirect).toHaveBeenCalledWith({
      scopes: environment.msalConfig.scopes,
    });
  });

  it('logout delega en logoutRedirect', () => {
    service.logout();
    expect(msal.logoutRedirect).toHaveBeenCalled();
  });
});
