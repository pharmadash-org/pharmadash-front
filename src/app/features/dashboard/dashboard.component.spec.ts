import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Chart, registerables } from 'chart.js';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from './dashboard.service';
import { MedicationService } from '../medications/medication.service';
import { Medication } from '../../core/models/medication.model';

function med(partial: Partial<Medication>): Medication {
  return {
    id: 'x',
    name: 'X',
    sku: 'X',
    category: 'Otro',
    price: '10',
    stock: 50,
    expiryDate: '2030-01-01',
    createdAt: '',
    updatedAt: '',
    isCriticalStock: false,
    isNearExpiry: false,
    ...partial,
  };
}

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let dash: jasmine.SpyObj<DashboardService>;
  let meds: jasmine.SpyObj<MedicationService>;

  beforeAll(() => Chart.register(...registerables));

  const medsPage = {
    success: true,
    data: {
      items: [
        med({ id: 'c', isCriticalStock: true }),
        med({ id: 'e', isNearExpiry: true }),
        med({ id: 'n' }),
      ],
      total: 3,
      page: 1,
      limit: 100,
      totalPages: 1,
    },
  };

  function configure(): void {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideNoopAnimations(),
        { provide: DashboardService, useValue: dash },
        { provide: MedicationService, useValue: meds },
      ],
    });
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    dash = jasmine.createSpyObj<DashboardService>('DashboardService', [
      'getKpis',
      'getTopSold',
    ]);
    meds = jasmine.createSpyObj<MedicationService>('MedicationService', [
      'getAll',
    ]);
    dash.getKpis.and.returnValue(
      of({
        success: true,
        data: { dailyRevenue: 1000, criticalStockCount: 1, nearExpiryCount: 1 },
      }),
    );
    dash.getTopSold.and.returnValue(
      of({
        success: true,
        data: [
          {
            medicationId: 'm1',
            name: 'Ibu',
            sku: 'IBU',
            totalQuantity: 9,
            totalRevenue: 90,
          },
        ],
      }),
    );
    meds.getAll.and.returnValue(of(medsPage));
  });

  it('carga KPIs y separa críticos / por vencer', () => {
    configure();
    expect(component.loading).toBeFalse();
    expect(component.kpis?.dailyRevenue).toBe(1000);
    expect(component.topSold.length).toBe(1);
    expect(component.criticalProducts.length).toBe(1);
    expect(component.nearExpiryProducts.length).toBe(1);
  });

  it('limita el top a 5', () => {
    dash.getTopSold.and.returnValue(
      of({
        success: true,
        data: Array.from({ length: 8 }, (_, i) => ({
          medicationId: 'm' + i,
          name: 'M' + i,
          sku: 'S' + i,
          totalQuantity: i,
          totalRevenue: i,
        })),
      }),
    );
    configure();
    expect(component.topSold.length).toBe(5);
  });

  it('un fallo en KPIs no tumba el resto', () => {
    dash.getKpis.and.returnValue(throwError(() => new Error('500')));
    configure();
    expect(component.kpis).toBeNull();
    expect(component.criticalProducts.length).toBe(1);
  });
});
