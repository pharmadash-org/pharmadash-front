import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/** Cuenta peticiones HTTP activas para mostrar la barra de progreso global. */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private count = 0;
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  start(): void {
    this.count++;
    if (this.count === 1) {
      this.loadingSubject.next(true);
    }
  }

  stop(): void {
    if (this.count > 0) {
      this.count--;
    }
    if (this.count === 0) {
      this.loadingSubject.next(false);
    }
  }
}
