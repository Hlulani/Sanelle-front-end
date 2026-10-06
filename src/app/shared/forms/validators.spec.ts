import { FormControl, FormGroup } from '@angular/forms';
import { anyFilled, calendarDate, matching, notAfter, notBefore, notBlank } from './validators';

describe('form validators', () => {
  it('treats spaces as blank', () => {
    expect(notBlank()(new FormControl('   '))).toEqual({ notBlank: true });
    expect(notBlank()(new FormControl(' Book a scan '))).toBeNull();
  });

  it('accepts only real calendar dates, leaving empty values to required', () => {
    expect(calendarDate()(new FormControl('2026-10-06'))).toBeNull();
    expect(calendarDate()(new FormControl(''))).toBeNull();
    expect(calendarDate()(new FormControl('2026-02-30'))).toEqual({ calendarDate: true });
  });

  it('keeps dates within limits', () => {
    const today = () => '2026-10-06';
    expect(notAfter(today)(new FormControl('2026-10-06'))).toBeNull();
    expect(notAfter(today)(new FormControl('2026-10-07'))).toEqual({ notAfter: { latest: '2026-10-06' } });
    expect(notBefore(today)(new FormControl('2026-10-05'))).toEqual({ notBefore: { earliest: '2026-10-06' } });
    expect(notBefore(today)(new FormControl(''))).toBeNull();
  });

  it('needs at least one field with more than spaces', () => {
    const group = new FormGroup(
      { a: new FormControl('  '), b: new FormControl('') },
      { validators: anyFilled('a', 'b') },
    );
    expect(group.errors).toEqual({ anyFilled: { names: ['a', 'b'] } });
    group.patchValue({ b: 'note' });
    expect(group.errors).toBeNull();
  });

  it('compares two fields', () => {
    const group = new FormGroup(
      { p: new FormControl('one'), q: new FormControl('two') },
      { validators: matching('p', 'q') },
    );
    expect(group.errors).toEqual({ matching: { first: 'p', second: 'q' } });
    group.patchValue({ q: 'one' });
    expect(group.errors).toBeNull();
  });
});
