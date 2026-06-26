import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-wrapper">
      <mat-card class="login-card">
        <div class="logo">
          <mat-icon class="logo-icon">local_pharmacy</mat-icon>
          <h1>PharmaDash</h1>
          <p class="subtitle">Gestión de inventario farmacéutico</p>
        </div>

        <button
          mat-raised-button
          color="primary"
          class="ms-btn"
          (click)="login()"
        >
          <mat-icon>login</mat-icon>
          Iniciar sesión con Microsoft
        </button>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .login-wrapper {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
      }
      .login-card {
        width: 360px;
        max-width: 90vw;
        padding: 40px 32px;
        text-align: center;
      }
      .logo-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        color: var(--pharma-primary);
      }
      h1 {
        margin: 12px 0 4px;
        color: var(--pharma-primary);
      }
      .subtitle {
        color: #666;
        margin: 0 0 28px;
      }
      .ms-btn {
        width: 100%;
        height: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
    `,
  ],
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.auth.isAuthenticated$.subscribe((authenticated) => {
      if (authenticated) {
        // Esperar los roles del access token para elegir el destino correcto.
        this.auth.ensureRolesLoaded().subscribe((roles) => {
          const target = roles.includes('Admin') ? '/dashboard' : '/medications';
          this.router.navigate([target]);
        });
      }
    });
  }

  login(): void {
    this.auth.login();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
