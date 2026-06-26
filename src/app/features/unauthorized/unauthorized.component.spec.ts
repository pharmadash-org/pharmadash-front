import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { UnauthorizedComponent } from './unauthorized.component';
import { AuthService } from '../../core/auth/auth.service';

describe('UnauthorizedComponent', () => {
  let fixture: ComponentFixture<UnauthorizedComponent>;
  let component: UnauthorizedComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['hasRole']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    TestBed.configureTestingModule({
      imports: [UnauthorizedComponent],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    fixture = TestBed.createComponent(UnauthorizedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('vuelve a /dashboard si es Admin', () => {
    auth.hasRole.and.returnValue(true);
    component.goHome();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('vuelve a /medications si no es Admin', () => {
    auth.hasRole.and.returnValue(false);
    component.goHome();
    expect(router.navigate).toHaveBeenCalledWith(['/medications']);
  });
});
