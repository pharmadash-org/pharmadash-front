import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    service = new LoadingService();
  });

  it('emite true al iniciar la primera petición', () => {
    const states: boolean[] = [];
    service.loading$.subscribe((s) => states.push(s));
    service.start();
    expect(states).toEqual([false, true]);
  });

  it('solo emite false cuando todas las peticiones terminan', () => {
    const states: boolean[] = [];
    service.loading$.subscribe((s) => states.push(s));
    service.start();
    service.start();
    service.stop();
    expect(states).toEqual([false, true]); // sigue cargando
    service.stop();
    expect(states).toEqual([false, true, false]);
  });

  it('stop no baja por debajo de cero', () => {
    service.stop();
    let last = true;
    service.loading$.subscribe((s) => (last = s));
    expect(last).toBeFalse();
  });
});
