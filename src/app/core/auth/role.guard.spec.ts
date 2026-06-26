import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { roleGuard } from './role.guard';
import { AuthService } from './auth.service';

describe('roleGuard', () => {
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  const run = (data: Record<string, unknown>) =>
    TestBed.runInInjectionContext(() =>
      roleGuard(
        { data } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ),
    ) as Observable<boolean | UrlTree>;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'ensureRolesLoaded',
    ]);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authSpy }],
    });
    router = TestBed.inject(Router);
  });

  it('permite el acceso cuando el usuario tiene el rol', (done) => {
    authSpy.ensureRolesLoaded.and.returnValue(of(['Admin']));
    run({ roles: ['Admin'] }).subscribe((result) => {
      expect(result).toBeTrue();
      done();
    });
  });

  it('redirige a /unauthorized cuando no tiene el rol', (done) => {
    authSpy.ensureRolesLoaded.and.returnValue(of(['Vendedor']));
    const tree = router.createUrlTree(['/unauthorized']);
    spyOn(router, 'createUrlTree').and.returnValue(tree);

    run({ roles: ['Admin'] }).subscribe((result) => {
      expect(result).toBeInstanceOf(UrlTree);
      expect(router.createUrlTree).toHaveBeenCalledWith(['/unauthorized']);
      done();
    });
  });

  it('permite el acceso cuando la ruta no exige roles', (done) => {
    authSpy.ensureRolesLoaded.and.returnValue(of([]));
    run({}).subscribe((result) => {
      expect(result).toBeTrue();
      done();
    });
  });
});
