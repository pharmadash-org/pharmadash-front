import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { DashboardService } from './dashboard.service';
import { environment } from '../../../environments/environment';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/dashboard`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DashboardService],
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debe crearse', () => {
    expect(service).toBeTruthy();
  });

  it('getKpis consulta /kpis', () => {
    service.getKpis().subscribe((r) => expect(r.success).toBeTrue());
    const req = httpMock.expectOne(`${base}/kpis`);
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      data: { dailyRevenue: 100, criticalStockCount: 2, nearExpiryCount: 1 },
    });
  });

  it('getTopSold consulta /top-sold', () => {
    service.getTopSold().subscribe((r) => expect(r.data?.length).toBe(1));
    const req = httpMock.expectOne(`${base}/top-sold`);
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      data: [
        {
          medicationId: 'm1',
          name: 'Ibuprofeno',
          sku: 'IBU-400',
          totalQuantity: 10,
          totalRevenue: 120000,
        },
      ],
    });
  });
});
