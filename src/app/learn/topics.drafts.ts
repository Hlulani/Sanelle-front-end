import { EvidenceTopic } from './evidence.model';

/**
 * DRAFT CONTENT. Researched against the original papers on 3 October 2026 and
 * not yet reviewed by a clinician or dietitian. Production builds replace this
 * file with topics.drafts.prod.ts, so none of this text ships in a release.
 */
export const DRAFT_TOPICS: EvidenceTopic[] = [
  {
    id: 'dairy',
    claim: 'If you have fibroids, cut out dairy.',
    question: 'Should I cut out dairy because I have fibroids?',
    shortAnswer:
      'We didn’t find research showing that dairy makes fibroids worse. The studies we found only looked at whether dairy is linked to being diagnosed with fibroids, and their results disagree. None of them looked at growth, bleeding, pain or fertility.',
    findings: [
      {
        outcome: 'incidence',
        verdict: 'mixed',
        summary:
          'Of two large US studies, one linked higher dairy intake with fewer new diagnoses. The other found no consistent link for dairy overall, only a small one for yogurt and calcium from food. A smaller study from China, which counted milk and soy together, linked frequent intake with more diagnoses. All three are observational, so none can show that dairy causes or prevents fibroids.',
        studyIds: ['wise-2010', 'orta-2020', 'gao-2018'],
      },
      {
        outcome: 'growth',
        verdict: 'none-found',
        summary: 'We found no studies on dairy and the growth of fibroids someone already has.',
        studyIds: [],
      },
      {
        outcome: 'bleeding',
        verdict: 'none-found',
        summary: 'We found no studies on dairy and heavy menstrual bleeding in people with fibroids.',
        studyIds: [],
      },
      {
        outcome: 'pain',
        verdict: 'none-found',
        summary: 'We found no studies on dairy and fibroid-related pain.',
        studyIds: [],
      },
      {
        outcome: 'fertility',
        verdict: 'none-found',
        summary: 'We found no studies on dairy and fertility in people with fibroids.',
        studyIds: [],
      },
    ],
    practical: [
      'These studies don’t give a reason to remove dairy because of fibroids. They also don’t show that eating more of it helps.',
      'Lactose intolerance, a milk allergy or instructions from your clinician are separate reasons to avoid dairy. You can record them in your food preferences.',
      'If you’re worried about your symptoms, they’re worth raising at your appointment rather than handling through diet alone.',
    ],
    studies: [
      {
        id: 'wise-2010',
        label: 'Black Women’s Health Study, US',
        citation:
          'Wise LA, et al. A prospective study of dairy intake and risk of uterine leiomyomata. Am J Epidemiol. 2010;171(2):221-232.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2800240/',
        design: 'prospective-cohort',
        population: '22,120 premenopausal Black women in the US, followed 1997 to 2007.',
        outcome: 'incidence',
        result:
          'Women in the highest dairy intake group had a lower rate of new fibroid diagnoses than those in the lowest group. The groups are comparisons within the study, not recommended amounts.',
        limitations: [
          'Diet was self-reported on questionnaires.',
          'Fibroids without symptoms were likely missed.',
          'Participants were more educated than Black women in the US overall.',
        ],
      },
      {
        id: 'orta-2020',
        label: 'Nurses’ Health Study II, US',
        citation:
          'Orta OR, Terry KL, Missmer SA, Harris HR. Dairy and related nutrient intake and risk of uterine leiomyoma: a prospective cohort study. Hum Reprod. 2020;35(2):453-463.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8489562',
        design: 'prospective-cohort',
        population: '81,590 premenopausal nurses in the US, followed 1991 to 2009.',
        outcome: 'incidence',
        result:
          'Total dairy was not consistently linked with new diagnoses. Higher intake of yogurt and of calcium from food was linked with slightly fewer.',
        limitations: [
          'Diagnoses were self-reported, though confirmed by ultrasound or surgery.',
          'Fibroids without symptoms were likely missed.',
          'No information on symptoms.',
        ],
      },
      {
        id: 'gao-2018',
        label: 'Single hospital, China',
        citation:
          'Gao M, Wang H. Frequent milk and soybean consumption are high risks for uterine leiomyoma: a prospective cohort study. Medicine (Baltimore). 2018;97(41):e12009.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6203589',
        design: 'prospective-cohort',
        population: '1,273 women at one hospital, with 982 followed for 5 years.',
        outcome: 'incidence',
        result:
          'Drinking milk or soy milk at least four times a week was linked with more fibroid diagnoses. Milk and soy were counted together, so the result can’t be attributed to dairy alone.',
        limitations: [
          'One hospital only.',
          'Milk and soy were combined into one measure, and amounts weren’t recorded.',
          'Combined a retrospective comparison with follow-up of the control group.',
        ],
      },
    ],
    review: { state: 'draft', researchedOn: '2026-10-03' },
    relatedFood: 'dairy',
  },
];
