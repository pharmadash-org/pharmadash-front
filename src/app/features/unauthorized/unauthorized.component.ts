import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrapper">
      <mat-icon class="icon">block</mat-icon>
      <h1>Acceso denegado</h1>
      <p>No tienes permisos para acceder a esta sección.</p>
      <button mat-raised-button color="primary" (click)="goHome()">
        Volver al inicio
      </button>
    </div>
  `,
  styles: [
    `
      .wrapper {
        min-height: 80vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 8px;
      }
      .icon {
        font-size: 72px;
        width: 72px;
        height: 72px;
        color: var(--pharma-critical);
      }
      h1 {
        margin: 8px 0 0;
      }
      p {
        color: #666;
        margin: 0 0 16px;
      }
    `,
  ],
})
export class UnauthorizedComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  goHome(): void {
    const target = this.auth.hasRole(['Admin']) ? '/dashboard' : '/medications';
    this.router.navigate([target]);
  }
}
