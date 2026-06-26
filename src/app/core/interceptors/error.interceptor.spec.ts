import { TestBed } from '@angular/core/testing';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorInterceptor } from './error.interceptor';
import { AuthService } from '../auth/auth.service';

describe('ErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['isLoggedIn']);
    auth.isLoggedIn.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
        { provide: Router, useValue: router },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: AuthService, useValue: auth },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function fire(status: number): void {
    http.get('/api/v1/x').subscribe({ next: () => {}, error: () => {} });
    httpMock
      .expectOne('/api/v1/x')
      .flush({ success: false }, { status, statusText: 'err' });
  }

  it('401 sin sesión redirige a /login', () => {
    auth.isLoggedIn.and.returnValue(false);
    fire(401);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('401 con sesión activa NO redirige (evita bucle) y avisa', () => {
    auth.isLoggedIn.and.returnValue(true);
    fire(401);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalled();
  });

  it('403 redirige a /unauthorized', () => {
    fire(403);
    expect(router.navigate).toHaveBeenCalledWith(['/unauthorized']);
  });

  it('404 muestra snackbar', () => {
    fire(404);
    expect(snackBar.open).toHaveBeenCalled();
  });

  it('500 muestra snackbar de error interno', () => {
    fire(500);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Error interno del servidor',
      'Cerrar',
      jasmine.any(Object),
    );
  });

  it('409 no navega ni muestra snackbar (lo maneja el componente)', () => {
    fire(409);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('422 no navega ni muestra snackbar (lo maneja el componente)', () => {
    fire(422);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('relanza el error para el consumidor', () => {
    let captured = 0;
    http.get('/api/v1/y').subscribe({
      next: () => fail('no debería completar'),
      error: (e) => (captured = e.status),
    });
    httpMock
      .expectOne('/api/v1/y')
      .flush({}, { status: 409, statusText: 'Conflict' });
    expect(captured).toBe(409);
  });
});
