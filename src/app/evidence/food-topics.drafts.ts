import { EvidenceTopic } from './food-topic.model';

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
  {
    id: 'soy',
    claim: 'If you have fibroids, avoid soy because its plant oestrogens make them grow.',
    title: 'Should I avoid soy?',
    question: 'Should I avoid soy foods because of their plant oestrogens?',
    answer: {
      headline: 'We found no good evidence that soy foods cause fibroids or make them grow.',
      detail: 'Studies on getting fibroids disagree, and almost none looked at people who already have them.',
    },
    findings: [
      {
        outcome: 'incidence',
        verdict: 'mixed',
        summary:
          'Three observational studies in the US and Japan found no clear link. A pooled analysis of a few small studies linked high soy intake with more diagnoses.',
        studyIds: ['wise-2010-soy', 'nagata-2009', 'atkinson-2006', 'qin-2019'],
      },
      {
        outcome: 'growth',
        verdict: 'indirect',
        summary:
          'No study of soy foods in people who already have fibroids. One supplement trial after menopause saw no growth in 13 women; a lab study found effects in both directions.',
        studyIds: ['steinberg-2011', 'moore-2007'],
      },
      {
        outcome: 'bleeding',
        verdict: 'none-found',
        summary: 'We found no studies on soy and bleeding in people with fibroids.',
        studyIds: [],
      },
      {
        outcome: 'pain',
        verdict: 'none-found',
        summary: 'We found no studies on soy and pain in people with fibroids.',
        studyIds: [],
      },
      {
        outcome: 'fertility',
        verdict: 'none-found',
        summary: 'We found no studies on soy and fertility in people with fibroids.',
        studyIds: [],
      },
    ],
    practical: [
      'These studies give no clear reason to cut out soy foods because of fibroids, but they can’t rule an effect out.',
      'Isoflavone supplements aren’t the same as soy foods. Ask your doctor before taking them.',
    ],
    studies: [
      {
        id: 'wise-2010-soy',
        label: 'Black Women’s Health Study, US',
        keyFinding: '22,120 women. Soy foods not linked with diagnoses.',
        citation:
          'Wise LA, et al. A prospective study of dairy intake and risk of uterine leiomyomata. Am J Epidemiol. 2010;171(2):221-232.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2800240/',
        design: 'prospective-cohort',
        population: '22,120 premenopausal Black women in the US, followed 1997 to 2007.',
        outcome: 'incidence',
        result: 'Soy food intake (soy milk, tofu, soy burgers) was not linked with being diagnosed with fibroids.',
        limitations: [
          'Soy intake was low compared with countries like Japan.',
          'Soy was asked about on one questionnaire only, as a secondary question.',
        ],
      },
      {
        id: 'nagata-2009',
        label: 'Health check-ups, Japan',
        keyFinding: '285 women. Soy isoflavones not linked with fibroids.',
        citation:
          'Nagata C, et al. Association of intakes of fat, dietary fibre, soya isoflavones and alcohol with uterine fibroids in Japanese women. Br J Nutr. 2009;101(10):1427-1431.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/19459228/',
        design: 'cross-sectional',
        population:
          '285 premenopausal women at health check-ups in Japan, 2003 to 2006; 54 had fibroids on ultrasound.',
        outcome: 'incidence',
        result:
          'No clear link between soy isoflavone intake and having fibroids, in a population where soy is commonly eaten.',
        limitations: [
          'Diet and fibroids measured at the same time, so it can’t show which came first.',
          'Only 54 women had fibroids.',
        ],
      },
      {
        id: 'atkinson-2006',
        label: 'Urine isoflavone study, US',
        keyFinding: '343 women. Isoflavone levels not linked with fibroids.',
        citation:
          'Atkinson C, et al. Lignan and isoflavone excretion in relation to uterine fibroids: a case-control study of young to middle-aged women in the United States. Am J Clin Nutr. 2006;84(3):587-593.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/16960173/',
        design: 'case-control',
        population: '170 women with fibroids and 173 without, in the US; isoflavones measured in urine.',
        outcome: 'incidence',
        result: 'Isoflavone levels in urine didn’t differ between women with and without fibroids.',
        limitations: [
          'Soy intake was low in this group.',
          'Urine reflects recent intake, measured after fibroids had developed.',
        ],
      },
      {
        id: 'qin-2019',
        label: 'Pooled analysis of studies',
        keyFinding: '7 adult studies. High soy intake linked with more fibroids.',
        citation:
          'Qin H, et al. High soy isoflavone or soy-based food intake during infancy and in adulthood is associated with an increased risk of uterine fibroids in premenopausal women: a meta-analysis. Nutr Res. 2019;71:30-42.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31668644/',
        design: 'systematic-review',
        population: 'Published studies up to December 2018: 7 on adult intake, 4 on soy infant formula.',
        outcome: 'incidence',
        result:
          'High compared with low soy food intake in adulthood was linked with more fibroids. The included studies were observational and their results varied.',
        limitations: [
          'Based on a small number of observational studies with inconsistent results.',
          'The authors call for larger studies with better soy measurement.',
          'We read the abstract only; the full text is paywalled.',
        ],
      },
      {
        id: 'steinberg-2011',
        label: 'Supplement trial after menopause, US',
        keyFinding: '13 women with fibroids. No growth over 2 years.',
        citation:
          'Steinberg FM, et al. Clinical outcomes of a 2-y soy isoflavone supplementation in menopausal women. Am J Clin Nutr. 2011;93(2):356-367.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3021428/',
        design: 'randomised-trial',
        population:
          '403 healthy women after menopause given isoflavone supplements or placebo for 2 years; 116 had ultrasound, 13 had fibroids.',
        outcome: 'growth',
        result:
          'No fibroid grew, and there was no difference between supplement and placebo groups. This was about supplements, after menopause.',
        limitations: [
          'Fibroids were a side measure in a bone-health trial; detailed data weren’t shown.',
          'Only 13 women had fibroids.',
          'Fibroids usually shrink after menopause, so this may not apply to younger women.',
        ],
      },
      {
        id: 'moore-2007',
        label: 'Lab study of fibroid cells, US',
        keyFinding: 'Cells in a dish. Effect depended on the amount.',
        citation:
          'Moore AB, et al. Stimulatory and inhibitory effects of genistein on human uterine leiomyoma cell proliferation are influenced by the concentration. Hum Reprod. 2007;22(10):2623-2631.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/17725991/',
        design: 'laboratory-or-animal',
        population: 'Human fibroid cells and normal uterine muscle cells grown in a lab.',
        outcome: 'growth',
        result:
          'Low amounts of genistein (a soy isoflavone) increased fibroid cell growth in the dish; high amounts slowed it. This doesn’t show what happens when people eat soy.',
        limitations: ['Cells in a dish, not people.', 'The amounts used may not match levels reached from food.'],
      },
    ],
    review: {
      state: 'draft',
      researchedOn: '2026-10-03',
    },
    relatedFood: 'soy',
  },
  {
    id: 'red-meat',
    claim: 'If you have fibroids, cut out red meat.',
    title: 'Should I cut out red meat?',
    question: 'Should I cut out red meat because I have fibroids?',
    answer: {
      headline: 'We found no research showing red meat makes fibroids worse.',
      detail: 'Studies on getting fibroids disagree, and none looked at people who already have them.',
    },
    findings: [
      {
        outcome: 'incidence',
        verdict: 'mixed',
        summary:
          'An Italian study linked eating more red meat with more diagnoses. Smaller studies in China and Korea found no clear link. None can show cause and effect.',
        studyIds: ['chiaffarino-1999', 'he-2013', 'kim-2024', 'parazzini-2015'],
      },
      {
        outcome: 'growth',
        verdict: 'none-found',
        summary: 'We found no studies on red meat and the growth of fibroids someone already has.',
        studyIds: [],
      },
      {
        outcome: 'bleeding',
        verdict: 'none-found',
        summary: 'We found no studies on red meat and heavy menstrual bleeding in people with fibroids.',
        studyIds: [],
      },
      {
        outcome: 'pain',
        verdict: 'none-found',
        summary: 'We found no studies on red meat and fibroid-related pain.',
        studyIds: [],
      },
      {
        outcome: 'fertility',
        verdict: 'none-found',
        summary: 'We found no studies on red meat and fertility in people with fibroids.',
        studyIds: [],
      },
    ],
    practical: [
      'These studies give no clear reason to cut out red meat because of fibroids, but they can’t rule an effect out.',
      'If your periods are heavy, talk to your doctor before cutting out foods. Iron matters when you lose a lot of blood.',
    ],
    studies: [
      {
        id: 'chiaffarino-1999',
        label: 'Hospital study, Italy',
        keyFinding: '2,400 women. More red meat, more diagnoses.',
        citation:
          'Chiaffarino F, Parazzini F, La Vecchia C, Chatenoud L, Di Cintio E, Marsico S. Diet and uterine myomas. Obstet Gynecol. 1999;94(3):395-398.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/10472866/',
        design: 'case-control',
        population:
          '843 women diagnosed with fibroids in the previous 2 years and 1,557 hospital patients without fibroids, Italy, 1986 to 1997.',
        outcome: 'incidence',
        result:
          'Women who ate the most beef and other red meat were more likely to have fibroids than those who ate the least. Ham showed a weaker link, and eating more green vegetables was linked with fewer fibroids. These are associations only.',
        limitations: [
          'Diet was recalled after fibroids were diagnosed.',
          'The comparison group were hospital patients, who may eat differently from other women.',
          'We read the abstract only; the full text is paywalled.',
        ],
      },
      {
        id: 'he-2013',
        label: 'Health check-ups, China',
        keyFinding: '283 women. No clear link for meat.',
        citation:
          'He Y, Zeng Q, Dong S, Qin L, Li G, Wang P. Associations between uterine fibroids and lifestyles including diet, physical activity and stress: a case-control study in China. Asia Pac J Clin Nutr. 2013;22(1):109-117.',
        url: 'https://apjcn.nhri.org.tw/server/APJCN/22/1/109.pdf',
        design: 'case-control',
        population:
          '73 women with fibroids confirmed by ultrasound or surgery and 210 women without, at a health check-up programme in China, 2009 to 2011.',
        outcome: 'incidence',
        result:
          'Eating more meat was not clearly linked with having fibroids. All meat was asked about as one group, not red meat on its own.',
        limitations: [
          'Small study, so it could miss a small link.',
          'Meat was one combined group.',
          'The food questionnaire recorded how often, not how much.',
        ],
      },
      {
        id: 'kim-2024',
        label: 'Health check-ups, South Korea',
        keyFinding: '672 women. No clear link for red meat.',
        citation:
          'Kim MJ, Kim S, Kim JJ, et al. Dietary intake is associated with the prevalence of uterine leiomyoma in Korean women: a retrospective cohort study. PLoS One. 2024;19(2):e0291157.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10868850/',
        design: 'cross-sectional',
        population:
          '672 women aged 23 to 73 having a check-up with pelvic ultrasound at one centre in Seoul, 2011; 220 had fibroids.',
        outcome: 'incidence',
        result:
          'Red meat intake was not clearly linked with having fibroids. Processed meat was linked with having fibroids in women after menopause.',
        limitations: [
          'Diet and fibroids were measured at the same time, so it can’t show which came first.',
          'Women who already knew about their fibroids may have changed their diet.',
          'Meat intake in this group was low.',
        ],
      },
      {
        id: 'parazzini-2015',
        label: 'Review of diet studies',
        keyFinding: '13 papers. Results on meat disagree.',
        citation:
          'Parazzini F, Di Martino M, Candiani M, Viganò P. Dietary components and uterine leiomyomas: a review of published data. Nutr Cancer. 2015;67(4):569-579.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/25826470/',
        design: 'systematic-review',
        population: '13 publications from 11 observational studies of diet and fibroids.',
        outcome: 'incidence',
        result:
          'The authors described the link with meat as controversial, meaning the studies didn’t agree. No combined estimate was given.',
        limitations: [
          'All the included studies were observational.',
          'We read the abstract only; the full text is paywalled.',
        ],
      },
    ],
    review: {
      state: 'draft',
      researchedOn: '2026-10-03',
    },
    relatedFood: 'red-meat',
  },
  {
    id: 'green-tea',
    claim: 'Green tea will shrink your fibroids.',
    title: 'Does green tea shrink fibroids?',
    question: 'Does drinking green tea, or taking green tea extract, help with fibroids?',
    answer: {
      headline: 'One small trial found green tea extract capsules shrank fibroids. Drinking tea hasn’t been studied.',
      detail:
        'The capsules are concentrated supplements, not cups of tea, and high-dose extract has been linked to raised liver enzymes.',
    },
    findings: [
      {
        outcome: 'incidence',
        verdict: 'indirect',
        summary:
          'No studies in people. One study in quail found fewer womb-like tumours when the birds were fed the main compound in green tea.',
        studyIds: ['ozercan-2008-quail'],
      },
      {
        outcome: 'growth',
        verdict: 'mixed',
        summary:
          'One small trial found fibroids shrank on extract capsules and grew on placebo. Another small study found no change. Studies of a combination tablet reported shrinkage, but had no placebo.',
        studyIds: ['roshdy-2013', 'biro-2021', 'porcaro-2020', 'miriello-2021', 'grandi-2022', 'zhang-2010-mice'],
      },
      {
        outcome: 'bleeding',
        verdict: 'mixed',
        summary:
          'In the small trial, women on extract capsules reported less monthly blood loss than on placebo. A 16-woman study of a combination tablet found periods were a little shorter but no lighter.',
        studyIds: ['roshdy-2013', 'grandi-2022'],
      },
      {
        outcome: 'pain',
        verdict: 'indirect',
        summary:
          'No study measured fibroid pain on its own. The small trial found a lower overall symptom score, and the 16-woman study found no change in period pain.',
        studyIds: ['roshdy-2013', 'grandi-2022'],
      },
      {
        outcome: 'fertility',
        verdict: 'none-found',
        summary:
          'No results yet. A US trial in women with fibroids trying to conceive has finished recruiting but hasn’t published.',
        studyIds: ['friend-2024'],
      },
    ],
    practical: [
      'Drinking green tea hasn’t been studied for fibroids. The results above are for concentrated capsules.',
      'Talk to your doctor before taking green tea extract, especially if you have liver problems, take other medicines or are trying to get pregnant.',
    ],
    studies: [
      {
        id: 'roshdy-2013',
        label: 'Small placebo trial, Egypt',
        keyFinding: '33 women. Fibroids shrank on capsules, grew on placebo.',
        citation:
          'Roshdy E, Rajaratnam V, Maitra S, Sabry M, Ait Allah AS, Al-Hendy A. Treatment of symptomatic uterine fibroids with green tea extract: a pilot randomized controlled clinical study. Int J Womens Health. 2013;5:477-486.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3742155/',
        design: 'randomised-trial',
        population:
          '39 women aged 18 to 50 with fibroid symptoms in Egypt, given extract capsules or placebo for 4 months; 33 finished.',
        outcome: 'growth',
        result:
          'Total fibroid volume fell by about a third on the extract and rose by about a quarter on placebo. The extract group also reported less monthly blood loss and a lower symptom score. No liver problems were seen.',
        limitations: [
          'Small pilot trial; the authors call for a larger one.',
          '6 of 17 women on placebo dropped out, leaving 11 to compare.',
          'Only 4 months long.',
          'Blood loss was self-reported.',
        ],
      },
      {
        id: 'biro-2021',
        label: 'Small study, Germany',
        keyFinding: '25 women. No change in fibroid size.',
        citation:
          'Biro R, Richter R, Ortiz M, Sehouli J, David M. Effects of epigallocatechin gallate-enriched green tea extract capsules in uterine myomas: results of an observational study. Arch Gynecol Obstet. 2021;303(5):1235-1243.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/33386959/',
        design: 'prospective-cohort',
        population: '25 women with few or no fibroid symptoms, taking extract capsules for 6 months, Germany.',
        outcome: 'growth',
        result: 'Fibroid size, symptoms and blood tests didn’t change over 6 months.',
        limitations: ['Very small, with no comparison group.', 'Women had few symptoms, unlike the Egyptian trial.'],
      },
      {
        id: 'porcaro-2020',
        label: 'Combination tablet, Italy',
        keyFinding: 'Smaller fibroids than in untreated women.',
        citation:
          'Porcaro G, Santamaria A, Giordano D, Angelozzi P. Vitamin D plus epigallocatechin gallate: a novel promising approach for uterine myomas. Eur Rev Med Pharmacol Sci. 2020;24(6):3344-3351.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/32271452/',
        design: 'prospective-cohort',
        population:
          'Women with fibroid symptoms in Italy, given a tablet of green tea extract, vitamin D and vitamin B6 for 4 months, compared with untreated women.',
        outcome: 'growth',
        result: 'Fibroids got smaller in the treated group and slightly larger in the untreated group.',
        limitations: [
          'No placebo, and it isn’t stated how women were put into groups.',
          'A combination tablet, so green tea’s part can’t be separated.',
          'We read the abstract only; the number of women isn’t given there.',
        ],
      },
      {
        id: 'miriello-2021',
        label: 'Combination tablet, Italy',
        keyFinding: '95 women. Smaller fibroids than untreated.',
        citation:
          'Miriello D, Galanti F, Cignini P, Antonaci D, Schiavi MC, Rago R. Uterine fibroids treatment: do we have new valid alternative? Experiencing the combination of vitamin D plus epigallocatechin gallate in childbearing age affected women. Eur Rev Med Pharmacol Sci. 2021;25(7):2843-2851.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/33877649/',
        design: 'prospective-cohort',
        population:
          '95 women with small fibroids in Rome, 2020; 41 took the tablet for 4 months and 54 had no treatment.',
        outcome: 'growth',
        result: 'Fibroids got smaller in the treated group and slightly larger in the untreated group.',
        limitations: [
          'Not randomised, and no placebo.',
          'A combination tablet, so green tea’s part can’t be separated.',
          'Only fibroids under 4 cm were included.',
          'We read the abstract only.',
        ],
      },
      {
        id: 'grandi-2022',
        label: 'Combination tablet, Italy',
        keyFinding: '16 women. Smaller fibroids, periods no lighter.',
        citation:
          'Grandi G, Del Savio MC, Melotti C, Feliciello L, Facchinetti F. Vitamin D and green tea extracts for the treatment of uterine fibroids in late reproductive life: a pilot, prospective, daily-diary based study. Gynecol Endocrinol. 2022;38(1):63-67.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/34658291/',
        design: 'prospective-cohort',
        population:
          '16 women over 40 with fibroids in Italy, taking green tea extract, vitamin D and vitamin B6 for 90 days.',
        outcome: 'bleeding',
        result:
          'Fibroids got somewhat smaller and periods were about a day shorter. How heavy periods were, and period pain, didn’t change.',
        limitations: [
          'Very small, with no comparison group.',
          'A combination tablet, so green tea’s part can’t be separated.',
          'We read the abstract only.',
        ],
      },
      {
        id: 'friend-2024',
        label: 'Fertility trial, US',
        keyFinding: 'Still running. No results published.',
        citation:
          'Al-Hendy A, Segars JH, Taylor HS, et al. Fibroids and unexplained infertility treatment with epigallocatechin gallate: a natural compound in green tea (FRIEND). BMJ Open. 2024;14(1):e078989. Trial NCT05364008.',
        url: 'https://clinicaltrials.gov/study/NCT05364008',
        design: 'randomised-trial',
        population:
          'Women with fibroids and unexplained infertility having fertility treatment, given extract or placebo. 200 were planned; the registry lists 33 enrolled.',
        outcome: 'fertility',
        result: 'No results yet. The main measure is live births.',
        limitations: [
          'Protocol only, no results.',
          'Far fewer women enrolled than planned, so it may be too small to answer the question.',
          'Run by the same research group as the Egyptian trial.',
        ],
      },
      {
        id: 'ozercan-2008-quail',
        label: 'Animal study, quail',
        keyFinding: 'Birds, not people. Fewer tumours with the compound.',
        citation:
          'Ozercan IH, Sahin N, Akdemir F, et al. Chemoprevention of fibroid tumors by [-]-epigallocatechin-3-gallate in quail. Nutr Res. 2008;28(2):92-97.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/19083394/',
        design: 'laboratory-or-animal',
        population: '180 quail fed a normal diet or one with added green tea compound for 12 months.',
        outcome: 'incidence',
        result:
          'Birds given the compound had fewer and smaller tumours in the oviduct. This doesn’t show what happens in people.',
        limitations: ['Birds, not people.', 'Oviduct tumours in quail aren’t the same as fibroids in the womb.'],
      },
      {
        id: 'zhang-2010-mice',
        label: 'Lab and mouse study, US',
        keyFinding: 'Mice, not people. Tumours grew more slowly.',
        citation:
          'Zhang D, Al-Hendy M, Richard-Davis G, et al. Green tea extract inhibits proliferation of uterine leiomyoma cells in vitro and in nude mice. Am J Obstet Gynecol. 2010;202(3):289.e1-9.',
        url: 'https://pubmed.ncbi.nlm.nih.gov/20074693/',
        design: 'laboratory-or-animal',
        population: 'Rat fibroid cells grown in a dish and in mice.',
        outcome: 'growth',
        result:
          'The green tea compound slowed the growth of the cells and of the tumours in mice. This doesn’t show what happens in people.',
        limitations: ['Rat cells in mice, not fibroids in women.'],
      },
    ],
    otherSources: [
      {
        label: 'Safety',
        citation:
          'EFSA Panel on Food Additives and Nutrient Sources added to Food (ANS), Younes M, et al. Scientific opinion on the safety of green tea catechins. EFSA J. 2018;16(4):e05239.',
        url: 'https://doi.org/10.2903/j.efsa.2018.5239',
      },
    ],
    review: {
      state: 'draft',
      researchedOn: '2026-10-03',
    },
    relatedFood: 'green-tea',
  },
];
