import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Valida que la fecha sea estrictamente futura (a partir de mañana). */
export function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    const value = new Date(control.value);
    if (Number.isNaN(value.getTime())) {
      return { futureDate: true };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    value.setHours(0, 0, 0, 0);
    return value.getTime() > today.getTime() ? null : { futureDate: true };
  };
}
