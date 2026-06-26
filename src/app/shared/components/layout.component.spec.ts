import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { of } from 'rxjs';
import { LayoutComponent } from './layout.component';
import { AuthService } from '../../core/auth/auth.service';

describe('LayoutComponent', () => {
  let fixture: ComponentFixture<LayoutComponent>;
  let component: LayoutComponent;

  function configure(matches: boolean): void {
    TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user$: of({ name: 'A', email: 'a@a.com', roles: ['Admin'] }),
            hasRole: () => true,
          },
        },
        {
          provide: BreakpointObserver,
          useValue: { observe: () => of({ matches, breakpoints: {} }) },
        },
      ],
    });
    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('se crea y observa el breakpoint (escritorio)', (done) => {
    configure(false);
    expect(component).toBeTruthy();
    component.isHandset$.subscribe((handset) => {
      expect(handset).toBeFalse();
      done();
    });
  });

  it('cierra el sidenav al navegar en modo over', () => {
    configure(true);
    const sidenav = {
      mode: 'over',
      close: jasmine.createSpy('close'),
    } as unknown as MatSidenav;
    component.closeOnHandset(sidenav);
    expect(sidenav.close).toHaveBeenCalled();
  });

  it('no cierra el sidenav en modo side', () => {
    configure(false);
    const sidenav = {
      mode: 'side',
      close: jasmine.createSpy('close'),
    } as unknown as MatSidenav;
    component.closeOnHandset(sidenav);
    expect(sidenav.close).not.toHaveBeenCalled();
  });
});
