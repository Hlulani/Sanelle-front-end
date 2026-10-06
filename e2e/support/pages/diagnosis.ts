import { expect } from '@playwright/test';
import { type } from '../screen';
import { ScreenObject } from './screen-object';

export interface Gap {
  label: string;
  question: string;
  saved: boolean;
}

export interface Detail {
  question: string;
  field: string;
  value: string;
}

/** The five diagnosis questions, one screen each. */
export class DiagnosisFlow extends ScreenObject {
  /** Answers one question with what the report says. */
  async record(detail: Detail, save = 'Save and continue'): Promise<void> {
    await this.arrive(this.heading(detail.question));
    await this.page.getByRole('radio', { name: 'I have this information' }).tap();
    await type(this.page.getByRole('textbox', { name: detail.field }), detail.value);
    await this.button(save, true).tap();
  }

  /** Leaves a detail unknown; its suggested question is saved unless `addQuestion` is false. */
  async leaveUnknown(question: string, suggested: string, addQuestion = true, save = 'Save and continue'): Promise<void> {
    await this.arrive(this.heading(question));
    await this.page.getByRole('radio', { name: 'I don’t know' }).tap();
    await expect(this.page.getByText(`“${suggested}”`)).toBeVisible();
    const add = this.page.getByRole('checkbox', { name: 'Add to my questions' });
    await expect(add).toBeChecked();
    if (!addQuestion) await add.uncheck();
    await this.button(save, true).tap();
  }

  /** The results screen: what the report says, and each gap with its question. */
  async results(): Promise<{ recorded: string[]; missing: Gap[] }> {
    await this.arrive(this.heading('Here’s what you have so far'));
    const recorded = await this.page.locator('.facts .fact-label').allInnerTexts();
    const missing: Gap[] = [];
    for (const gap of await this.page.locator('.gaps > li').all()) {
      const ask = (await gap.locator('.ask').innerText()).trim();
      missing.push({
        label: (await gap.locator('.fact-label').innerText()).trim(),
        saved: ask.startsWith('Question saved'),
        question: ask.replace(/^(Question saved|You could ask)\s*/, '').replace(/^“|”$/g, ''),
      });
    }
    return { recorded: recorded.map((r) => r.trim()), missing };
  }

  /** Saves a gap's question straight from the results screen. */
  async saveQuestionFor(label: string): Promise<void> {
    const gap = this.page.locator('.gaps > li').filter({ has: this.page.getByText(label, { exact: true }) });
    await gap.getByRole('button', { name: 'Save this question' }).tap();
    await expect(gap.getByText('Question saved')).toBeVisible();
  }

  /** Leaves the results screen for Today. */
  async done(): Promise<void> {
    await this.button('Done', true).tap();
    await this.arrive(this.heading(/^Hi /));
  }

  async seeQuestions(): Promise<void> {
    await this.link('See my questions').tap();
    await this.arrive(this.heading('Your questions'));
  }
}
