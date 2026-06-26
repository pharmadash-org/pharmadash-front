import { CurrencyCopPipe } from './currency-cop.pipe';

describe('CurrencyCopPipe', () => {
  const pipe = new CurrencyCopPipe();

  it('formatea un número', () => {
    const out = pipe.transform(12000);
    expect(out).toContain('12.000');
    expect(out).toContain('$');
  });

  it('parsea un string decimal de Prisma', () => {
    const out = pipe.transform('12000.50');
    expect(out).toContain('12.00'); // formateado con separador de miles
    expect(out).toContain('$');
  });

  it('devuelve $0 ante null/undefined/vacío', () => {
    expect(pipe.transform(null)).toContain('0');
    expect(pipe.transform(undefined)).toContain('0');
    expect(pipe.transform('')).toContain('0');
  });

  it('devuelve $0 ante un valor no numérico', () => {
    expect(pipe.transform('abc')).toContain('0');
  });
});
