import { CatalogEntry, EvidenceStatus, EvidenceTopic, OutcomeKind, ResearchClaim, ReviewEvent } from './evidence.model';
import { RESEARCH_CLAIMS } from './research-claims.data';
import { DRAFT_TOPICS } from './food-topics.drafts';
import { STUDY_DESIGN_LABELS } from './food-topic.model';

const RESEARCH_CUTOFF = '2026-10-06';
const REVIEWER = 'Research-library synthesis; independent clinical review pending';

const TOPIC_BY_DOMAIN: Record<string, EvidenceTopic> = {
  population: 'population',
  biology: 'biology',
  natural_history: 'growth',
  diagnosis: 'diagnosis',
  symptoms_anemia: 'symptoms',
  patient_experience: 'appointment',
  risk_prevention: 'food',
  medical_management: 'treatment',
  procedures: 'treatment',
  reproduction: 'reproduction',
  measurement: 'measurement',
  access_equity: 'access',
  economics: 'access',
  infrastructure: 'research',
};

/** What a published entry says to patients, and where. Everything else stays internal. */
interface Publication {
  title: string;
  explanation: string;
  population: string;
  outcome: string;
  usedBy: string[];
  outcomes?: { kind: OutcomeKind; text: string }[];
  practicalTake?: string;
}

const PUBLISHED: Record<string, Publication> = {
  C09: {
    title: 'Size alone doesn’t describe a fibroid',
    explanation:
      'A size tells you how big the largest fibroid measured. It doesn’t say how many there are, where they are or whether the inside of the uterus is affected. When a report leaves a detail out, Sanelle keeps it as not recorded instead of guessing.',
    population: 'Scan classification guidance, and a trial of people whose uterine cavity was normal.',
    outcome: 'How fibroids are described in scan reports.',
    usedBy: ['ONB-03 Known diagnosis details', 'HLT-01 Diagnosis overview', 'HLT-02 Report explanations'],
  },
  C10: {
    title: 'Checking the copying isn’t a medical check',
    explanation:
      'When you compare the details Sanelle read with your report, you confirm the copying, not the medical finding. What a finding means is for the person who wrote the report, or your doctor, to explain.',
    population: 'Scan classification guidance and studies comparing self-report with ultrasound.',
    outcome: 'Where a recorded detail came from and who confirmed it.',
    usedBy: ['RPT-03 Check extracted details', 'RPT-04 Report saved', 'HLT-02 Report explanations'],
  },
  C11: {
    title: 'Size and symptoms answer different questions',
    explanation:
      'Bleeding, pain, pressure and their effect on your day can matter even when fibroids are small, and a large fibroid doesn’t always cause symptoms. Symptoms can also have other causes, so your check-ins describe what you noticed, not what caused it.',
    population: 'Guidance on fibroid care and studies of heavy menstrual bleeding.',
    outcome: 'Symptoms and their effect on daily life.',
    usedBy: ['SYM-03 Any symptom impact'],
  },
  C12: {
    title: 'Check-ins can’t diagnose anaemia',
    explanation:
      'Tiredness or heavy bleeding in your check-ins can’t show whether you have anaemia or low iron. That needs a blood test. If you have a result, you can save its exact value; Sanelle won’t interpret it.',
    population: 'Studies of heavy bleeding and anaemia recorded with diagnosis codes, not blood tests.',
    outcome: 'Anaemia and iron deficiency.',
    usedBy: ['SYM-03 Heavy bleeding or tiredness', 'SYM-04 Reported clinical result'],
  },
  C14: {
    title: 'Your concern belongs in the conversation',
    explanation:
      'Some people with fibroids describe feeling dismissed, or having their symptoms treated as normal. Writing down your main concern and how symptoms affect your day can help you raise them. These studies describe some people’s experiences, not how often this happens.',
    population: 'Interview and survey studies of people with fibroids in selected countries.',
    outcome: 'Experiences of care and communication.',
    usedBy: ['SYM-03 Appointment preparation', 'APT-01 Editable summary'],
  },
  C15: {
    title: 'A summary’s benefit is still being tested',
    explanation:
      'An appointment summary may help you remember questions and bring up what matters. No study has tested whether Sanelle’s summary improves visits or health, so use it only if it helps you.',
    population: 'Patient studies of care needs; no study of Sanelle.',
    outcome: 'Usefulness of an appointment summary (untested).',
    usedBy: ['SYM-03 Appointment preparation', 'APT-01 Editable summary'],
  },
  C16: {
    title: 'Getting fibroids is a different question from shrinking them',
    explanation:
      'Some studies link parts of diet with how often fibroids are diagnosed. Those are observational links about getting fibroids. They aren’t evidence that a food shrinks fibroids someone already has.',
    population: 'Mostly large observational cohorts, such as a cohort of nurses in the United States.',
    outcome: 'New fibroid diagnoses (incidence), not growth.',
    usedBy: ['FOOD-04 Food claim explanation'],
    outcomes: [
      {
        kind: 'incidence',
        text: 'Some diet patterns are linked with how often fibroids are diagnosed. Links aren’t causes.',
      },
      { kind: 'growth', text: 'These studies didn’t measure whether existing fibroids grew or shrank.' },
    ],
  },
  C17: {
    title: 'No food plan has been shown to remove fibroids',
    explanation:
      'No reliably established whole-food regimen that removes fibroids was demonstrated in this bounded review. Sanelle’s meals are for practical, enjoyable eating, not treatment.',
    population: 'Diet cohorts, supplement trials and a trial protocol that hasn’t reported results.',
    outcome: 'Removal or shrinkage of existing fibroids.',
    usedBy: ['FOOD-01 Choose food task', 'FOOD-02 Recipe', 'FOOD-04 Food claim explanation'],
    practicalTake:
      'Use meals for practical nourishment, preference and convenience—not as a promised fibroid treatment. Discuss supplement use or individual dietary concerns with a qualified clinician or dietitian.',
    outcomes: [
      { kind: 'incidence', text: 'Observational links between diet and new diagnoses don’t show cause.' },
      { kind: 'growth', text: 'No whole-food plan was shown to shrink or remove fibroids in this review.' },
      { kind: 'symptoms', text: 'No food plan was shown to reduce fibroid bleeding or pain in this review.' },
      {
        kind: 'supplements',
        text: 'Supplement trials test pills or extracts in selected groups. They don’t test meals.',
      },
      { kind: 'fertility', text: 'No evidence here that a food plan changes fertility outcomes.' },
    ],
  },
  C18: {
    title: 'Vitamin D research is mixed',
    explanation:
      'Studies of vitamin D look at different questions: who gets fibroids, how fibroids change over time, and what happened when selected people took supplements. The results don’t agree well enough to call vitamin D a treatment. If you’re unsure about your vitamin D, you can ask about testing.',
    population: 'Cohorts with ultrasound, small supplement trials and a genetic study.',
    outcome: 'Incidence, measured growth and supplementation, each separately.',
    usedBy: ['FOOD-04 Food claim explanation'],
    outcomes: [
      { kind: 'incidence', text: 'Findings differ between populations.' },
      { kind: 'growth', text: 'Some cohorts link lower vitamin D with growth; this doesn’t show cause.' },
      { kind: 'supplements', text: 'Small trials in people with low vitamin D; not a cure.' },
    ],
  },
  C19: {
    title: 'A green-tea extract trial isn’t the same as drinking tea',
    explanation:
      'A small trial gave people an extract from green tea (EGCG) as a supplement. It doesn’t show that drinking tea or eating particular meals treats fibroids, and long-term effects and safety weren’t established.',
    population: 'A small pilot trial; a larger trial has published its plan, not results.',
    outcome: 'Supplement effects on fibroid measures.',
    usedBy: ['FOOD-04 Food claim explanation'],
    outcomes: [
      { kind: 'supplements', text: 'An extract, in a small pilot. Promising but limited.' },
      { kind: 'fertility', text: 'Benefit for fertility wasn’t shown.' },
    ],
  },
  C20: {
    title: 'Food or products can’t tell you what caused your fibroids',
    explanation:
      'Studies link some environmental exposures with fibroids across groups of people. They can’t identify the cause of one person’s fibroids, and nothing here suggests your fibroids are your fault.',
    population: 'Observational studies of chemical and product exposures.',
    outcome: 'New fibroid diagnoses across groups.',
    usedBy: ['FOOD-04 Food claim explanation'],
  },
  C34: {
    title: 'Your check-ins are a personal record',
    explanation:
      'Sanelle’s check-in helps you remember and describe your symptoms. It isn’t a validated questionnaire, so it doesn’t score your symptoms or compare you with other people.',
    population: 'Studies of symptom and quality-of-life questionnaires.',
    outcome: 'How symptoms are measured.',
    usedBy: ['SYM-01 Daily check-in'],
  },
  C36: {
    title: 'Bleeding categories aren’t millilitres',
    explanation:
      'Your bleeding categories, from none to very heavy, are your own words for your experience. They can’t be turned into a blood volume or a diagnosis.',
    population: 'Studies of pictorial bleeding charts and their validation.',
    outcome: 'Measuring menstrual blood loss.',
    usedBy: ['SYM-01 Daily check-in', 'SYM-03 Statistics'],
  },
  C37: {
    title: 'Missing days stay unknown',
    explanation:
      'A day without a check-in tells us nothing about that day. Sanelle counts only the days you recorded and shows how many are missing, so a gap never reads as a symptom-free day.',
    population: 'Guidance on reporting outcomes in heavy bleeding trials.',
    outcome: 'Counting recorded and missing days.',
    usedBy: ['SYM-02 30-day history', 'SYM-03 Statistics'],
  },
  C44: {
    title: 'Ticking a meal as prepared isn’t a record of eating it',
    explanation:
      'Marking a meal as prepared helps you keep track of cooking. It doesn’t record what or how much you ate, and Sanelle never uses it to judge an effect on fibroids.',
    population: 'Diet cohorts, a supplement pilot and a trial protocol.',
    outcome: 'Meal preparation, not consumption.',
    usedBy: ['FOOD-03 Meal plan'],
  },
};

function claimHistory(claim: ResearchClaim, published: boolean): ReviewEvent[] {
  const history: ReviewEvent[] = [
    {
      date: claim.asOf,
      status: 'draft',
      by: 'Research library',
      note: 'Drafted from the claim-to-evidence map (single-analyst synthesis).',
    },
    {
      date: claim.asOf,
      status: 'in-review',
      by: 'Research library',
      note: 'Source reading depth and limitations are recorded in the library. No independent reviewer sign-off is recorded.',
    },
  ];
  if (published)
    history.push({
      date: '2026-10-07',
      status: 'published',
      by: 'Prototype content configuration',
      note: 'Available as a research summary in this prototype. This is not clinical approval; independent clinical review remains pending.',
    });
  return history;
}

function fromClaim(claim: ResearchClaim): CatalogEntry {
  const publication = PUBLISHED[claim.claimId];
  const status: EvidenceStatus = publication ? 'published' : 'in-review';
  return {
    id: `EV-${claim.claimId}`,
    claimId: claim.claimId,
    title: publication?.title ?? claim.claim,
    topic: TOPIC_BY_DOMAIN[claim.domain] ?? 'research',
    explanation: publication?.explanation ?? claim.claim,
    population: publication?.population ?? 'See sources.',
    outcome: publication?.outcome ?? claim.domain.replace(/_/g, ' '),
    findings: `${claim.confidence}. ${claim.basis}`,
    limitations: `${claim.limits} ${claim.verification}.`,
    sources: claim.sources,
    reviewer: REVIEWER,
    reviewDate: publication ? '2026-10-07' : claim.asOf,
    version: publication?.practicalTake ? '1.1' : publication ? '1.0' : '0.9',
    researchCutoff: RESEARCH_CUTOFF,
    status,
    history: [
      ...claimHistory(claim, !!publication),
      ...(publication?.practicalTake
        ? [
            {
              date: '2026-10-10',
              status: 'published' as EvidenceStatus,
              by: 'Prototype content configuration',
              note: 'Restored the practical-take paragraph from the supplied Figma source. Independent clinical review remains pending.',
            },
          ]
        : []),
    ],
    usedBy: publication?.usedBy ?? [],
    outcomes: publication?.outcomes,
    practicalTake: publication?.practicalTake,
  };
}

/** Draft food topics written before the catalogue existed. Internal until reviewed. */
function fromDraftTopic(topic: (typeof DRAFT_TOPICS)[number]): CatalogEntry {
  return {
    id: `EV-FOOD-${topic.id.toUpperCase()}`,
    title: topic.title,
    topic: 'food',
    explanation: `${topic.answer.headline} ${topic.answer.detail}`,
    population: [...new Set(topic.studies.map((s) => s.population))].join(' · ') || 'See sources.',
    outcome: topic.findings.map((f) => f.outcome).join(', '),
    findings: topic.findings.map((f) => f.summary).join(' '),
    limitations: topic.studies.flatMap((s) => s.limitations).join(' '),
    sources: topic.studies.map((s) => ({
      id: s.id,
      label: s.label,
      title: s.citation,
      type: STUDY_DESIGN_LABELS[s.design],
      url: s.url,
      depth: 'Read for the draft topic',
    })),
    reviewer: 'Not yet reviewed',
    reviewDate: topic.review.researchedOn,
    version: '0.1',
    researchCutoff: topic.review.researchedOn,
    status: 'draft',
    history: [
      {
        date: topic.review.researchedOn,
        status: 'draft',
        by: 'Sanelle content',
        note: 'Researched against the original papers; not reviewed by a clinician or dietitian.',
      },
    ],
    usedBy: [],
  };
}

export const CATALOG: CatalogEntry[] = [...RESEARCH_CLAIMS.map(fromClaim), ...DRAFT_TOPICS.map(fromDraftTopic)];
