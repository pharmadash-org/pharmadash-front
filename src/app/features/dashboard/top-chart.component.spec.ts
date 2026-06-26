import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Chart, registerables } from 'chart.js';
import { TopChartComponent } from './top-chart.component';
import { TopSoldItem } from '../../core/models/kpi.model';

describe('TopChartComponent', () => {
  let fixture: ComponentFixture<TopChartComponent>;
  let component: TopChartComponent;

  beforeAll(() => Chart.register(...registerables));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TopChartComponent],
      providers: [provideNoopAnimations()],
    });
    fixture = TestBed.createComponent(TopChartComponent);
    component = fixture.componentInstance;
  });

  it('mapea los items a labels y datos del gráfico', () => {
    const items: TopSoldItem[] = [
      {
        medicationId: 'm1',
        name: 'Ibuprofeno',
        sku: 'IBU',
        totalQuantity: 10,
        totalRevenue: 100,
      },
      {
        medicationId: 'm2',
        name: 'Aspirina',
        sku: 'ASP',
        totalQuantity: 5,
        totalRevenue: 50,
      },
    ];
    component.items = items;
    component.ngOnChanges();

    expect(component.barData.labels).toEqual(['Ibuprofeno', 'Aspirina']);
    expect(component.barData.datasets[0].data).toEqual([10, 5]);
  });

  it('soporta lista vacía', () => {
    component.items = [];
    component.ngOnChanges();
    fixture.detectChanges();
    expect(component.barData.labels).toEqual([]);
    expect(fixture.nativeElement.querySelector('.empty')).not.toBeNull();
  });
});
