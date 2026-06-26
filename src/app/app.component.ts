import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent implements OnInit {
  private readonly msal = inject(MsalService);
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    // Procesa la respuesta del Authorization Code Flow tras el redirect.
    this.msal.handleRedirectObservable().subscribe({
      error: (err) => console.error('MSAL redirect error', err),
    });
    this.auth.init();
  }
}
