import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { HasRoleDirective } from '../directives/has-role.directive';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    HasRoleDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-nav-list>
      <a
        *appHasRole="['Admin']"
        mat-list-item
        routerLink="/dashboard"
        routerLinkActive="active-link"
        (click)="navigate.emit()"
      >
        <mat-icon matListItemIcon>dashboard</mat-icon>
        <span matListItemTitle>Dashboard</span>
      </a>

      <a
        mat-list-item
        routerLink="/medications"
        routerLinkActive="active-link"
        (click)="navigate.emit()"
      >
        <mat-icon matListItemIcon>inventory_2</mat-icon>
        <span matListItemTitle>Inventario</span>
      </a>

      <a
        mat-list-item
        routerLink="/sales"
        routerLinkActive="active-link"
        (click)="navigate.emit()"
      >
        <mat-icon matListItemIcon>point_of_sale</mat-icon>
        <span matListItemTitle>Ventas</span>
      </a>
    </mat-nav-list>
  `,
  styles: [
    `
      .active-link {
        background: rgba(21, 101, 192, 0.12);
        color: var(--pharma-primary);
        font-weight: 500;
      }
      mat-icon[matListItemIcon] {
        color: inherit;
      }
    `,
  ],
})
export class SidebarComponent {
  @Output() navigate = new EventEmitter<void>();
}
