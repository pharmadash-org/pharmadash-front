import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formatea un valor numérico (o string Decimal) como moneda colombiana (COP).
 */
@Pipe({
  name: 'currencyCop',
  standalone: true,
})
export class CurrencyCopPipe implements PipeTransform {
  private readonly formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return this.formatter.format(0);
    }
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (Number.isNaN(num)) {
      return this.formatter.format(0);
    }
    return this.formatter.format(num);
  }
}
