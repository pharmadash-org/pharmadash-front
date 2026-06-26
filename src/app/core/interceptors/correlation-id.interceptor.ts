import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';

function uuidv4(): string {
  const cryptoObj =
    typeof globalThis !== 'undefined'
      ? (globalThis.crypto as Crypto | undefined)
      : undefined;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  // Fallback RFC4122 v4 usando bytes criptográficos
  const bytes = new Uint8Array(16);
  (cryptoObj ?? globalThis.crypto).getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return [...bytes]
    .map((b, i) =>
      [4, 6, 8, 10].includes(i)
        ? '-' + b.toString(16).padStart(2, '0')
        : b.toString(16).padStart(2, '0'),
    )
    .join('');
}

/** Adjunta un header X-Correlation-Id (uuid v4) a cada request. */
@Injectable()
export class CorrelationIdInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    const cloned = req.clone({
      setHeaders: { 'X-Correlation-Id': uuidv4() },
    });
    return next.handle(cloned);
  }
}
