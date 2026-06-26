import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { HasRoleDirective } from './has-role.directive';
import { AuthService } from '../../core/auth/auth.service';
import { AppUser } from '../../core/models/kpi.model';

@Component({
  standalone: true,
  imports: [HasRoleDirective],
  template: `
    <span *appHasRole="['Admin']" class="admin">admin</span>
    <span *appHasRole="['Vendedor']" class="seller">seller</span>
  `,
})
class HostComponent {}

describe('HasRoleDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let user$: BehaviorSubject<AppUser | null>;
  let auth: Partial<AuthService>;
  let roles: string[];

  beforeEach(() => {
    roles = [];
    user$ = new BehaviorSubject<AppUser | null>(null);
    auth = {
      user$: user$.asObservable(),
      hasRole: (required: string[]) => required.some((r) => roles.includes(r)),
    };

    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: AuthService, useValue: auth }],
    });
    fixture = TestBed.createComponent(HostComponent);
  });

  function adminEl(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.admin');
  }
  function sellerEl(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.seller');
  }

  it('oculta ambos cuando no hay roles', () => {
    fixture.detectChanges();
    expect(adminEl()).toBeNull();
    expect(sellerEl()).toBeNull();
  });

  it('muestra solo el elemento Admin para un Admin', () => {
    roles = ['Admin'];
    fixture.detectChanges();
    user$.next({ name: 'A', email: 'a@a.com', roles });
    fixture.detectChanges();
    expect(adminEl()).not.toBeNull();
    expect(sellerEl()).toBeNull();
  });

  it('muestra solo el elemento Vendedor para un Vendedor', () => {
    roles = ['Vendedor'];
    fixture.detectChanges();
    user$.next({ name: 'V', email: 'v@v.com', roles });
    fixture.detectChanges();
    expect(adminEl()).toBeNull();
    expect(sellerEl()).not.toBeNull();
  });
});
