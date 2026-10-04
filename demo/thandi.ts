/**
 * Thandi is a fictional demo user. Everything here is made-up demonstration data,
 * kept in one place so every recording shows the same journey.
 */
export const APP_URL = process.env['SANELLE_APP_URL'] ?? 'http://localhost:4200';
export const API_URL = process.env['SANELLE_API_URL'] ?? 'http://localhost:8080/api/v1';

export const THANDI = {
  email: 'thandi.demo@example.test',
  username: 'Thandi',
  password: 'Demo-Thandi-2026!',
};

/** What Thandi copies from her (fictional) scan report, one answer per diagnosis step. */
export const DIAGNOSIS = {
  count: { field: 'Number of fibroids', value: '2' },
  largestSize: { field: 'Size of the largest fibroid', value: '4.1 cm' },
  location: { field: 'Where the fibroids are located', value: 'intramural, posterior wall' },
  // Her report doesn't mention the cavity, so she leaves it unknown and saves the suggested question.
  unknownQuestion: 'Is my uterine cavity affected?',
  figo: { field: 'FIGO type stated in the report', value: 'FIGO 4' },
};

export const FOOD_QUESTION = {
  title: 'Should I cut out dairy?',
  outcome: /Getting fibroids/,
  study: /Black Women.s Health Study/,
};
