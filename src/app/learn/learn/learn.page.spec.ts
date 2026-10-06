import { claimToQuestion } from './learn.page';

describe('claimToQuestion', () => {
  it('turns a claim into a question for an appointment, without judging it', () => {
    expect(claimToQuestion('Sugar makes fibroids grow.')).toBe(
      'I read that “Sugar makes fibroids grow”. Does this apply to me?',
    );
    expect(claimToQuestion('  avoid coffee!!  ')).toBe('I read that “avoid coffee”. Does this apply to me?');
  });
});
