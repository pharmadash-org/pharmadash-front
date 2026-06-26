import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { KpiCardComponent } from './kpi-card.component';

describe('KpiCardComponent', () => {
  let fixture: ComponentFixture<KpiCardComponent>;
  let component: KpiCardComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [KpiCardComponent],
      providers: [provideNoopAnimations()],
    });
    fixture = TestBed.createComponent(KpiCardComponent);
    component = fixture.componentInstance;
  });

  it('renderiza título, valor e ícono', () => {
    component.title = 'Stock crítico';
    component.value = 6;
    component.icon = 'warning';
    component.tone = 'critical';
    component.badge = 'Atención';
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Stock crítico');
    expect(el.textContent).toContain('6');
    expect(el.textContent).toContain('Atención');
  });

  it('badgeClass varía según el tono', () => {
    component.tone = 'critical';
    expect(component.badgeClass).toBe('badge-critical');
    component.tone = 'warning';
    expect(component.badgeClass).toBe('badge-warning');
    component.tone = 'primary';
    expect(component.badgeClass).toBe('badge-ok');
  });

  it('no muestra badge si no se asigna', () => {
    component.title = 'Ingresos';
    component.value = '$ 0';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.badge')).toBeNull();
  });
});
