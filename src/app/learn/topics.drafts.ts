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
    title: 'Should I cut out dairy?',
    question: 'Should I cut out dairy because I have fibroids?',
    answer: {
      headline: 'We found no research showing dairy makes fibroids worse.',
      detail: 'The few studies only looked at getting fibroids, and they disagree.',
    },
    findings: [
      {
        outcome: 'incidence',
        verdict: 'mixed',
        summary:
          'Three observational studies point different ways. None can show that dairy causes or prevents fibroids.',
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
      'These studies give no reason to cut dairy because of fibroids, or to eat more.',
      'Lactose intolerance, an allergy or your doctor’s advice are separate reasons to avoid it.',
    ],
    studies: [
      {
        id: 'wise-2010',
        label: 'Black Women’s Health Study, US',
        keyFinding: '22,120 women. More dairy, fewer diagnoses.',
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
        keyFinding: '81,590 women. No clear link for dairy overall.',
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
        keyFinding: '1,273 women. Milk and soy counted together, more diagnoses.',
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
