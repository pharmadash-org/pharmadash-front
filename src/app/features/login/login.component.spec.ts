import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/auth/auth.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let authenticated$: BehaviorSubject<boolean>;

  function setup(authenticated: boolean, roles: string[]): void {
    authenticated$ = new BehaviorSubject<boolean>(authenticated);
    auth = jasmine.createSpyObj<AuthService>('AuthService', [
      'login',
      'ensureRolesLoaded',
    ]);
    (auth as unknown as { isAuthenticated$: unknown }).isAuthenticated$ =
      authenticated$.asObservable();
    auth.ensureRolesLoaded.and.returnValue(of(roles));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('redirige a /dashboard cuando es Admin', () => {
    setup(true, ['Admin']);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('redirige a /medications cuando no es Admin', () => {
    setup(true, ['Vendedor']);
    expect(router.navigate).toHaveBeenCalledWith(['/medications']);
  });

  it('no redirige si no está autenticado y permite login', () => {
    setup(false, []);
    expect(router.navigate).not.toHaveBeenCalled();
    component.login();
    expect(auth.login).toHaveBeenCalled();
  });
});
