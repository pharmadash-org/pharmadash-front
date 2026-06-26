import { FormControl } from '@angular/forms';
import { futureDateValidator } from './future-date.validator';

describe('futureDateValidator', () => {
  const validator = futureDateValidator();

  it('acepta una fecha futura', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    expect(validator(new FormControl(future))).toBeNull();
  });

  it('rechaza la fecha de hoy', () => {
    expect(validator(new FormControl(new Date()))).toEqual({ futureDate: true });
  });

  it('rechaza una fecha pasada', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(validator(new FormControl(past))).toEqual({ futureDate: true });
  });

  it('rechaza un valor inválido', () => {
    expect(validator(new FormControl('no-es-fecha'))).toEqual({
      futureDate: true,
    });
  });

  it('no valida cuando el campo está vacío', () => {
    expect(validator(new FormControl(''))).toBeNull();
  });
});
