import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar color="primary" class="header">
      <button
        mat-icon-button
        class="menu-btn"
        (click)="toggle.emit()"
        aria-label="Abrir menú"
      >
        <mat-icon>menu</mat-icon>
      </button>

      <mat-icon class="brand-icon">local_pharmacy</mat-icon>
      <span class="brand">PharmaDash</span>

      <span class="spacer"></span>

      <ng-container *ngIf="auth.user$ | async as user">
        <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
          <div class="avatar">{{ initials(user.name) }}</div>
          <span class="user-name">{{ user.name }}</span>
          <mat-icon>arrow_drop_down</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <div class="menu-header">
            <strong>{{ user.name }}</strong>
            <small>{{ user.email }}</small>
            <small *ngIf="user.roles.length" class="roles">
              {{ user.roles.join(', ') }}
            </small>
          </div>
          <button mat-menu-item (click)="auth.logout()">
            <mat-icon>logout</mat-icon>
            <span>Cerrar sesión</span>
          </button>
        </mat-menu>
      </ng-container>
    </mat-toolbar>
  `,
  styles: [
    `
      .header {
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .spacer {
        flex: 1 1 auto;
      }
      .brand {
        font-weight: 500;
        margin-left: 8px;
      }
      .brand-icon {
        margin-left: 4px;
      }
      .user-btn {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 600;
      }
      .menu-header {
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        border-bottom: 1px solid #eee;
      }
      .menu-header .roles {
        color: var(--pharma-primary);
      }
      @media (max-width: 768px) {
        .user-name {
          display: none;
        }
      }
      @media (min-width: 960px) {
        .menu-btn {
          display: none;
        }
      }
    `,
  ],
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  @Output() toggle = new EventEmitter<void>();

  initials(name: string): string {
    return name
      .split(' ')
      .map((p) => p.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
