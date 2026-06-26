import { Injectable, inject } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

/** Activa/desactiva la barra de progreso global según peticiones en vuelo. */
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private readonly loading = inject(LoadingService);

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    this.loading.start();
    return next.handle(req).pipe(finalize(() => this.loading.stop()));
  }
}
