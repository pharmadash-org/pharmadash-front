import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../core/auth/auth.service';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;
  let auth: Partial<AuthService>;

  beforeEach(() => {
    auth = {
      user$: of({ name: 'John Doe', email: 'jd@x.com', roles: ['Admin'] }),
      logout: jasmine.createSpy('logout'),
    };
    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideNoopAnimations(),
        { provide: AuthService, useValue: auth },
      ],
    });
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('muestra el nombre del usuario', () => {
    expect(fixture.nativeElement.textContent).toContain('John Doe');
  });

  it('calcula las iniciales', () => {
    expect(component.initials('John Doe')).toBe('JD');
    expect(component.initials('Santiago')).toBe('S');
  });

  it('emite toggle', () => {
    const spy = jasmine.createSpy('toggle');
    component.menuToggle.subscribe(spy);
    component.menuToggle.emit();
    expect(spy).toHaveBeenCalled();
  });
});
