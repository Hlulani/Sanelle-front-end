import { HealthRecord, HealthReport, SymptomEntry, reportStatus } from '../my-health/diagnosis.model';
import { MealPlan, PlanDay } from '../food/meal-plan';
import { daysBetween, parseLocalDate } from '../shared/calendar-date';

/**
 * TOD-02: one explicit next step, chosen by a workflow order (not a medical-risk ranking):
 * 1. a date she saved (appointment or review date), 2. a report she left unchecked,
 * 3. her latest check-in, 4. her saved meal plan, 5. a flexible task chooser.
 */
export type NextStep =
  | { kind: 'appointment'; date: string; days: number; questions: number }
  | { kind: 'review'; date: string; days: number; title: string }
  | { kind: 'report'; report: HealthReport }
  | { kind: 'checkin'; entry: SymptomEntry }
  | { kind: 'meal'; day: PlanDay | null; plan: MealPlan }
  | { kind: 'chooser' };

export function nextStep(record: HealthRecord, plan: MealPlan | null, today: string): NextStep {
  const appointment = record.appointment.date && record.appointment.date >= today ? record.appointment.date : null;
  const review = (record.tasks ?? [])
    .filter((t) => !t.completedAt && t.dueDate && t.dueDate >= today)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))[0];
  if (appointment && (!review || appointment <= review.dueDate!)) {
    const open = record.questions.filter((q) => (q.status ?? (q.answer?.trim() ? 'answered' : 'open')) === 'open');
    return { kind: 'appointment', date: appointment, days: daysBetween(today, appointment), questions: open.length };
  }
  if (review)
    return { kind: 'review', date: review.dueDate!, days: daysBetween(today, review.dueDate!), title: review.title };

  const unchecked = (record.reports ?? [])
    .filter((r) => reportStatus(r) === 'needs-checking')
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0];
  if (unchecked) return { kind: 'report', report: unchecked };

  const latest = [...(record.symptoms ?? [])].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (latest) return { kind: 'checkin', entry: latest };

  if (plan && plan.days[plan.days.length - 1]?.date >= today)
    return { kind: 'meal', plan, day: plan.days.find((d) => d.date === today) ?? null };

  return { kind: 'chooser' };
}

/** TOD-03: what she did and where it went. Derived from saved records, so it can't drift from them. */
export interface ActivityItem {
  at: string;
  title: string;
  detail: string;
  route: string;
  queryParams?: Record<string, string>;
}

export function recentActivity(record: HealthRecord, plan: MealPlan | null, limit = 6): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const e of record.symptoms ?? []) {
    items.push({
      at: e.updatedAt ?? `${e.date}T12:00:00`,
      title: 'Check-in saved',
      detail: `For ${dayName(e.date)} · in your symptom history`,
      route: '/health/symptoms',
    });
  }
  for (const r of record.reports ?? []) {
    if (r.source || reportStatus(r) === 'needs-checking')
      items.push({
        at: r.savedAt,
        title: 'Report added',
        detail: `${r.title} · ${reportStatus(r) === 'checked' ? 'checked' : 'details still need checking'}`,
        route: reportStatus(r) === 'checked' ? `/health/report/${r.id}/saved` : '/health/report/check',
        queryParams: reportStatus(r) === 'checked' ? undefined : { id: r.id },
      });
    if (r.checkedAt)
      items.push({
        at: r.checkedAt,
        title: 'Report checked',
        detail: `${r.title} · in My health and your appointment summary`,
        route: `/health/report/${r.id}/saved`,
      });
  }
  for (const q of record.questions) {
    items.push({
      at: q.createdAt,
      title: 'Visit question added',
      detail: `“${truncate(q.text)}” · in Appointment`,
      route: '/tabs/appointment',
    });
    for (const h of q.history ?? []) {
      if (h.status === 'answered' || h.status === 'unresolved')
        items.push({
          at: h.at,
          title: h.status === 'answered' ? 'Answer recorded' : 'Question marked unresolved',
          detail: `“${truncate(q.text)}” · in Appointment`,
          route: '/tabs/appointment',
        });
    }
  }
  for (const r of record.results ?? []) {
    items.push({
      at: r.savedAt,
      title: 'Reported clinical result saved',
      detail: `${r.name} · in My health`,
      route: '/health/results',
    });
  }
  for (const t of record.tasks ?? []) {
    items.push({
      at: t.createdAt,
      title: 'Next step saved',
      detail: `${truncate(t.title)} · in Appointment`,
      route: '/tabs/appointment',
    });
  }
  if (plan?.savedAt)
    items.push({
      at: plan.savedAt,
      title: 'Meal plan saved',
      detail: `${plan.days.length}-day plan · in Food`,
      route: '/food/plan',
    });
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

function truncate(text: string, max = 48): string {
  return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text;
}

export function dayName(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(
    parseLocalDate(iso),
  );
}

export function whenLabel(days: number): string {
  return days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
}
