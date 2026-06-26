import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { SaleService } from './sale.service';
import { environment } from '../../../environments/environment';
import { CreateSaleDto } from '../../core/models/sale.model';

describe('SaleService', () => {
  let service: SaleService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/sales`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SaleService],
    });
    service = TestBed.inject(SaleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debe crearse', () => {
    expect(service).toBeTruthy();
  });

  it('processSale hace POST con los items', () => {
    const dto: CreateSaleDto = {
      items: [{ medicationId: 'm1', quantity: 2 }],
    };
    service.processSale(dto).subscribe((r) => expect(r.success).toBeTrue());
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ success: true, data: { saleId: 's1' } });
  });

  it('propaga errores 422 del backend', () => {
    const dto: CreateSaleDto = { items: [{ medicationId: 'm1', quantity: 99 }] };
    let errStatus = 0;
    service.processSale(dto).subscribe({
      next: () => fail('no debería completar'),
      error: (e) => (errStatus = e.status),
    });
    const req = httpMock.expectOne(base);
    req.flush(
      {
        success: false,
        error: { code: 'UNPROCESSABLE_ENTITY', message: 'Insufficient stock' },
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    expect(errStatus).toBe(422);
  });
});
