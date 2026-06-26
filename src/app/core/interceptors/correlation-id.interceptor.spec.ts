import { TestBed } from '@angular/core/testing';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { CorrelationIdInterceptor } from './correlation-id.interceptor';

describe('CorrelationIdInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: CorrelationIdInterceptor,
          multi: true,
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('agrega el header X-Correlation-Id con formato uuid v4', () => {
    http.get('/api/v1/test').subscribe();
    const req = httpMock.expectOne('/api/v1/test');
    const id = req.request.headers.get('X-Correlation-Id');
    expect(id).toBeTruthy();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    req.flush({});
  });

  it('genera un id distinto por request', () => {
    http.get('/api/v1/a').subscribe();
    http.get('/api/v1/b').subscribe();
    const a = httpMock.expectOne('/api/v1/a');
    const b = httpMock.expectOne('/api/v1/b');
    expect(a.request.headers.get('X-Correlation-Id')).not.toBe(
      b.request.headers.get('X-Correlation-Id'),
    );
    a.flush({});
    b.flush({});
  });
});
