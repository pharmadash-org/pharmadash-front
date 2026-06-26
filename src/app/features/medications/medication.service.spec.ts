import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { MedicationService } from './medication.service';
import { environment } from '../../../environments/environment';
import {
  CreateMedicationDto,
  Medication,
  PaginatedResponse,
} from '../../core/models/medication.model';

describe('MedicationService', () => {
  let service: MedicationService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/medications`;

  const sample: Medication = {
    id: '1',
    name: 'Ibuprofeno',
    sku: 'IBU-400',
    category: 'Antiinflamatorio',
    price: '12000.50',
    stock: 5,
    expiryDate: '2027-01-01',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    isCriticalStock: true,
    isNearExpiry: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MedicationService],
    });
    service = TestBed.inject(MedicationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debe crearse', () => {
    expect(service).toBeTruthy();
  });

  it('getAll arma los query params y devuelve la página', () => {
    const resp: PaginatedResponse<Medication> = {
      success: true,
      data: { items: [sample], total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    service
      .getAll({ page: 1, limit: 10, name: 'ibu', category: 'Antiinflamatorio' })
      .subscribe((r) => expect(r.data.items.length).toBe(1));

    const req = httpMock.expectOne(
      (r) => r.url === base && r.params.get('name') === 'ibu',
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('10');
    expect(req.request.params.get('category')).toBe('Antiinflamatorio');
    req.flush(resp);
  });

  it('getAll omite name y category vacíos', () => {
    service.getAll({ page: 2, limit: 25 }).subscribe();
    const req = httpMock.expectOne(
      (r) => r.url === base && r.params.get('page') === '2',
    );
    expect(req.request.params.has('name')).toBeFalse();
    expect(req.request.params.has('category')).toBeFalse();
    req.flush({
      success: true,
      data: { items: [], total: 0, page: 2, limit: 25, totalPages: 0 },
    });
  });

  it('search usa el endpoint /search con q', () => {
    service.search('ibu').subscribe((r) => expect(r.success).toBeTrue());
    const req = httpMock.expectOne(
      (r) => r.url === `${base}/search` && r.params.get('q') === 'ibu',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [sample] });
  });

  it('getById consulta por id', () => {
    service.getById('1').subscribe((r) => expect(r.data?.id).toBe('1'));
    const req = httpMock.expectOne(`${base}/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: sample });
  });

  it('create hace POST con el dto', () => {
    const dto: CreateMedicationDto = {
      name: 'Ibuprofeno',
      sku: 'IBU-400',
      category: 'Antiinflamatorio',
      price: 12000.5,
      stock: 5,
      expiryDate: '2027-01-01',
    };
    service.create(dto).subscribe((r) => expect(r.success).toBeTrue());
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ success: true, data: sample });
  });

  it('update hace PUT a /:id', () => {
    service.update('1', { stock: 10 }).subscribe();
    const req = httpMock.expectOne(`${base}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ stock: 10 });
    req.flush({ success: true, data: { ...sample, stock: 10 } });
  });

  it('delete hace DELETE y maneja 204 sin body', () => {
    let completed = false;
    service.delete('1').subscribe(() => (completed = true));
    const req = httpMock.expectOne(`${base}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(completed).toBeTrue();
  });
});
