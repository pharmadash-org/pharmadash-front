import {
  Directive,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Estructural: muestra el elemento solo si el usuario posee alguno de los
 * roles indicados.  Uso:  *appHasRole="['Admin']"
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective implements OnInit, OnDestroy {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);
  private sub?: Subscription;
  private required: string[] = [];
  private visible = false;

  @Input() set appHasRole(roles: string[] | string) {
    this.required = Array.isArray(roles) ? roles : [roles];
    this.update();
  }

  ngOnInit(): void {
    this.sub = this.auth.user$.subscribe(() => this.update());
  }

  private update(): void {
    const allowed = this.auth.hasRole(this.required);
    if (allowed && !this.visible) {
      this.vcr.createEmbeddedView(this.tpl);
      this.visible = true;
    } else if (!allowed && this.visible) {
      this.vcr.clear();
      this.visible = false;
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
