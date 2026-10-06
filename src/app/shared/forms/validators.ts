import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { isIsoDate } from '../calendar-date';

/** Something besides spaces; `Validators.required` alone accepts "   ". */
export function notBlank(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null =>
    String(control.value ?? '').trim() ? null : { notBlank: true };
}

/** A real calendar date ('YYYY-MM-DD'); an empty value is left to `Validators.required`. */
export function calendarDate(): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null =>
    !control.value || isIsoDate(control.value) ? null : { calendarDate: true };
}

/** A date no later than `latest` (both 'YYYY-MM-DD', so they compare as strings). */
export function notAfter(latest: () => string): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null =>
    control.value && control.value > latest() ? { notAfter: { latest: latest() } } : null;
}

/** A date no earlier than `earliest`. */
export function notBefore(earliest: () => string): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null =>
    control.value && control.value < earliest() ? { notBefore: { earliest: earliest() } } : null;
}

/** Group rule: at least one of the named text fields has something in it besides spaces. */
export function anyFilled(...names: string[]): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null =>
    names.some((n) => String(group.get(n)?.value ?? '').trim()) ? null : { anyFilled: { names } };
}

/** Group rule: two fields hold the same value, for example a passphrase and its repeat. */
export function matching(first: string, second: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null =>
    group.get(first)?.value === group.get(second)?.value ? null : { matching: { first, second } };
}
