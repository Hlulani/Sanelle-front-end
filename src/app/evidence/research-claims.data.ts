/**
 * The 44 claims of the research library's claim-to-evidence map (snapshot 6 October 2026),
 * with their sources and reading depth. Generated from the library's CSV files; edit the
 * library and regenerate rather than changing this file by hand. Patient-facing wording,
 * status and review history live in evidence-catalog.ts.
 */
import { ResearchClaim } from './evidence.model';

export const RESEARCH_CLAIMS: ResearchClaim[] = [
  {
    claimId: 'C01',
    domain: 'population',
    claim: 'Fibroids are common; there is no single prevalence percentage for every population.',
    confidence: 'Supported distinction',
    basis:
      'Age, ascertainment, geography and case definition change estimates. Frequently quoted ultrasound cumulative estimates are not clinical-diagnosis prevalence.',
    limits: 'Primary Baird report remains abstract-only; global prevalence needs further regional screening.',
    productRule: 'State the population and detection method whenever displaying a prevalence number.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'G01',
        label: 'FIGO 2025 epidemiology/pathogenesis',
        title: 'The epidemiology and pathogenesis of uterine fibroids.',
        type: 'Clinical narrative review',
        url: 'https://europepmc.org/article/MED/41014005',
        depth: 'Full main text read',
      },
      {
        id: 'R18',
        label: 'Mitro et al., 2025 — clinical diagnosis',
        title: 'Uterine Fibroid Diagnosis by Race and Ethnicity in an Integrated Health Care System.',
        type: 'Original health-system cohort',
        url: 'https://europepmc.org/article/MED/40172885',
        depth: 'Full main text read',
      },
      {
        id: 'R39',
        label: 'Myers et al., 2012 — self-report validation',
        title: 'Self-report versus ultrasound measurement of uterine fibroid status.',
        type: 'Original diagnostic cross-sectional analysis of two cohorts',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3298676/',
        depth: 'Full main text read',
      },
      {
        id: 'M01',
        label: 'Baird et al., 2003 — ultrasound screening.',
        title: 'High cumulative incidence of uterine leiomyoma in black and white women: ultrasound evidence.',
        type: 'Unclassified in this audit',
        url: 'https://scholars.duke.edu/publication/769704',
        depth: 'Abstract or metadata only',
      },
    ],
  },
  {
    claimId: 'C02',
    domain: 'population',
    claim: 'A person without a reported diagnosis may still have a fibroid detected on ultrasound.',
    confidence: 'Supported in studied settings',
    basis:
      'Historical self-report had low sensitivity in selected US cohorts; agreement differs in other age/settings.',
    limits: 'No universal sensitivity or app diagnostic accuracy established.',
    productRule: 'Record self-reported, report-confirmed and clinician-confirmed status separately.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R39',
        label: 'Myers et al., 2012 — self-report validation',
        title: 'Self-report versus ultrasound measurement of uterine fibroid status.',
        type: 'Original diagnostic cross-sectional analysis of two cohorts',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3298676/',
        depth: 'Full main text read',
      },
      {
        id: 'R27',
        label: 'Adebamowo et al., 2023 — self-report versus ultrasound in Nigeria',
        title: 'Validation of self-report of uterine fibroid diagnosis using a transvaginal ultrasound scan.',
        type: 'Original cross-sectional diagnostic-agreement analysis',
        url: 'https://europepmc.org/article/MED/37277479',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C03',
    domain: 'biology',
    claim: 'Fibroids involve genetic and cellular pathways; a simple excess-estrogen explanation is incomplete.',
    confidence: 'Supported biological complexity',
    basis:
      'Tumor variants, progesterone responses, cellular composition and matrix biology are different evidence layers.',
    limits: 'Mechanistic model effects do not establish a patient treatment.',
    productRule: 'Explain biology without diagnosing hormone imbalance from symptoms.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R11',
        label: 'Kim et al., 2025 — genetic susceptibility',
        title:
          'Genome-wide meta-analysis identifies novel risk loci for uterine fibroids within and across multiple ancestry groups.',
        type: 'Original genome-wide meta-analysis',
        url: 'https://europepmc.org/article/MED/40050615',
        depth: 'Full main text read',
      },
      {
        id: 'R21',
        label: 'Mäkinen et al., 2011 — South African MED12 tumors',
        title: 'MED12 exon 2 mutations are common in uterine leiomyomas from South African patients.',
        type: 'Original molecular pathology study',
        url: 'https://europepmc.org/article/MED/22182697',
        depth: 'Full main text read',
      },
      {
        id: 'R22',
        label: 'Ishikawa et al., 2010 — hormone mechanisms',
        title: 'Progesterone is essential for maintenance and growth of uterine leiomyoma.',
        type: 'Original human-tissue xenograft experiment',
        url: 'https://europepmc.org/article/MED/20375184',
        depth: 'Full main text read',
      },
      {
        id: 'R37',
        label: 'Goad et al., 2022 — single-cell fibroid atlas',
        title: 'Single-cell sequencing reveals novel cellular heterogeneity in uterine leiomyomas.',
        type: 'Original human-tissue single-cell transcriptomic and variant analysis',
        url: 'https://doi.org/10.1093/humrep/deac183',
        depth: 'Full main text read',
      },
      {
        id: 'R43',
        label: 'Turunen et al., 2014 — MED12 functional mechanisms',
        title: 'Uterine leiomyoma-linked MED12 mutations disrupt mediator-associated CDK activity.',
        type: 'Original engineered-cell/recombinant-protein mechanistic experiments',
        url: 'https://doi.org/10.1016/j.celrep.2014.03.047',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C04',
    domain: 'biology',
    claim: 'A finding in a genetically engineered cell or tissue graft does not demonstrate a human cure.',
    confidence: 'Supported inferential boundary',
    basis:
      'Controlled experiments establish mechanisms under model conditions; donor counts and model construction constrain inference.',
    limits: 'Clinical target validation, doses and long-term safety still missing.',
    productRule: 'Label laboratory evidence explicitly; do not translate it into meal or supplement promises.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R22',
        label: 'Ishikawa et al., 2010 — hormone mechanisms',
        title: 'Progesterone is essential for maintenance and growth of uterine leiomyoma.',
        type: 'Original human-tissue xenograft experiment',
        url: 'https://europepmc.org/article/MED/20375184',
        depth: 'Full main text read',
      },
      {
        id: 'R37',
        label: 'Goad et al., 2022 — single-cell fibroid atlas',
        title: 'Single-cell sequencing reveals novel cellular heterogeneity in uterine leiomyomas.',
        type: 'Original human-tissue single-cell transcriptomic and variant analysis',
        url: 'https://doi.org/10.1093/humrep/deac183',
        depth: 'Full main text read',
      },
      {
        id: 'R43',
        label: 'Turunen et al., 2014 — MED12 functional mechanisms',
        title: 'Uterine leiomyoma-linked MED12 mutations disrupt mediator-associated CDK activity.',
        type: 'Original engineered-cell/recombinant-protein mechanistic experiments',
        url: 'https://doi.org/10.1016/j.celrep.2014.03.047',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C05',
    domain: 'biology',
    claim: 'Rare inherited/pathological contexts should be distinguished from ordinary fibroids.',
    confidence: 'Context supported; primary depth incomplete',
    basis: 'Guidance describes distinct mechanisms; the MED12 discovery original is not fully read.',
    limits: 'Original FH kindred and genetic reports remain outside completed main readings.',
    productRule: 'Do not imply that every fibroid is hereditary or every patient needs genetic testing.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'G01',
        label: 'FIGO 2025 epidemiology/pathogenesis',
        title: 'The epidemiology and pathogenesis of uterine fibroids.',
        type: 'Clinical narrative review',
        url: 'https://europepmc.org/article/MED/41014005',
        depth: 'Full main text read',
      },
      {
        id: 'G02',
        label: 'FIGO 2025 diagnosis/classification',
        title: 'Diagnosis and classification of uterine fibroids.',
        type: 'Clinical narrative guidance',
        url: 'https://europepmc.org/article/MED/40970558',
        depth: 'Full main text read',
      },
      {
        id: 'M05',
        label: 'Mäkinen et al., 2011 — tumor genetics.',
        title: 'MED12, the mediator complex subunit 12 gene, is mutated at high frequency in uterine leiomyomas.',
        type: 'Unclassified in this audit',
        url: 'https://pubmed.ncbi.nlm.nih.gov/21868628/',
        depth: 'Abstract or metadata only',
      },
    ],
  },
  {
    claimId: 'C06',
    domain: 'natural_history',
    claim: 'Individual fibroids can grow or regress at different rates.',
    confidence: 'Supported in selected cohort',
    basis: 'Serial MRI tracked 262 tumors in 72 people; lesions varied even within one person.',
    limits: 'Selected larger disease burden and limited observational horizon; not an individual prognosis.',
    productRule: 'Preserve lesion identity, dates and units before presenting a growth comparison.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R01',
        label: 'Peddada et al., 2008 — growth',
        title: 'Growth of uterine leiomyomata among premenopausal black and white women.',
        type: 'Original MRI cohort',
        url: 'https://europepmc.org/article/MED/19047643',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C07',
    domain: 'natural_history',
    claim: 'A smaller or undetected postpartum lesion is not proof of permanent eradication.',
    confidence: 'Supported distinction',
    basis:
      'Ultrasound nondetection, diameter reduction and MRI confirmation differ; the cohort required pregnancy continuing to at least 20 weeks.',
    limits: 'Cannot generalize to all pregnancies, losses or lifetime recurrence.',
    productRule: 'Describe measured change and modality; avoid a cured label.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R45',
        label: 'Laughlin et al., 2010 — pregnancy and postpartum change.',
        title: 'Pregnancy-related fibroid reduction.',
        type: 'Peer-reviewed original research report',
        url: 'https://scholars.duke.edu/publication/1278957',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C08',
    domain: 'natural_history',
    claim: 'Postmenopausal surgical data cannot estimate cancer risk for the general fibroid population.',
    confidence: 'Supported inferential boundary',
    basis:
      'R55 studied a mixed pathological endpoint among operated complete cases; 55/707 is 7.78%, rather than the printed 0.078%.',
    limits: 'Composite-specific pathology counts and independent external validation remain unchecked.',
    productRule: 'Do not implement a nomogram-based cancer-risk score.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R55',
        label:
          'R55 — Development and Validation of a Nomogram to Predict the Risk of Special Uterine Leiomyoma Pathological Types or Leiomyosarcoma in Postmenopausal Women: A Retrospective Study',
        title:
          'Development and Validation of a Nomogram to Predict the Risk of Special Uterine Leiomyoma Pathological Types or Leiomyosarcoma in Postmenopausal Women: A Retrospective Study',
        type: 'Retrospective diagnostic-prediction development with internal bootstrap validation',
        url: 'https://doi.org/10.2147/RMHP.S461773',
        depth: 'Full main text read',
      },
      {
        id: 'G02',
        label: 'FIGO 2025 diagnosis/classification',
        title: 'Diagnosis and classification of uterine fibroids.',
        type: 'Clinical narrative guidance',
        url: 'https://europepmc.org/article/MED/40970558',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C09',
    domain: 'diagnosis',
    claim: 'Size alone does not capture fibroid type, location or cavity involvement.',
    confidence: 'Supported classification distinction',
    basis:
      'Anatomy and reproductive setting alter relevance; AMIGOS participants with a normal cavity represent a specific population.',
    limits: 'One largest dimension does not fully describe multiple lesions.',
    productRule: 'Keep count, units, location, cavity involvement and FIGO independently unknown when absent.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'G02',
        label: 'FIGO 2025 diagnosis/classification',
        title: 'Diagnosis and classification of uterine fibroids.',
        type: 'Clinical narrative guidance',
        url: 'https://europepmc.org/article/MED/40970558',
        depth: 'Full main text read',
      },
      {
        id: 'R48',
        label: 'AMIGOS secondary analysis, 2017 — non-cavity-distorting fibroids and IUI.',
        title:
          'Association of uterine fibroids and pregnancy outcomes after ovarian stimulation-intrauterine insemination for unexplained infertility.',
        type: 'Peer-reviewed original research report',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5472203/',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C10',
    domain: 'diagnosis',
    claim: 'Patient-confirmed OCR text is not clinician verification of the finding.',
    confidence: 'Product/data inference',
    basis:
      'Clinical classification and ascertainment require source identity; OCR confirmation verifies transcription.',
    limits: 'Sanelle OCR diagnostic performance was not clinically evaluated by this review.',
    productRule: 'Save original wording, source, date and confirmation type; never infer missing location.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'G02',
        label: 'FIGO 2025 diagnosis/classification',
        title: 'Diagnosis and classification of uterine fibroids.',
        type: 'Clinical narrative guidance',
        url: 'https://europepmc.org/article/MED/40970558',
        depth: 'Full main text read',
      },
      {
        id: 'R39',
        label: 'Myers et al., 2012 — self-report validation',
        title: 'Self-report versus ultrasound measurement of uterine fibroid status.',
        type: 'Original diagnostic cross-sectional analysis of two cohorts',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3298676/',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C11',
    domain: 'symptoms_anemia',
    claim: 'Bleeding, pain, pressure and functional effects can matter even when size is small.',
    confidence: 'Supported symptom-centered approach',
    basis: 'Anatomical and symptomatic measures are related but not interchangeable.',
    limits: 'Symptoms can have other causes; no single app score establishes attribution.',
    productRule: 'Prioritize impact and the next-care question rather than a size-only severity label.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'G02',
        label: 'FIGO 2025 diagnosis/classification',
        title: 'Diagnosis and classification of uterine fibroids.',
        type: 'Clinical narrative guidance',
        url: 'https://europepmc.org/article/MED/40970558',
        depth: 'Full main text read',
      },
      {
        id: 'G03',
        label: 'FIGO 2025 medical treatment',
        title: 'Medical treatment of fibroids: FIGO best practice guidance.',
        type: 'Clinical narrative guidance',
        url: 'https://europepmc.org/article/MED/40927887',
        depth: 'Full main text read',
      },
      {
        id: 'R05',
        label: 'Ricci et al., 2022 — anemia',
        title: 'Characteristics of Submucous Myomas and the Risk of Anemia.',
        type: 'Original retrospective clinical study',
        url: 'https://europepmc.org/article/MED/36422191',
        depth: 'Full main text read',
      },
      {
        id: 'R16',
        label: 'Borah et al., 2013 — burden and preferences',
        title: 'The impact of uterine leiomyomas: a national survey of affected women.',
        type: 'Original cross-sectional online survey',
        url: 'https://europepmc.org/article/MED/23891629',
        depth: 'Full main text read',
      },
      {
        id: 'R38',
        label: 'Cooper et al., 2023 — heavy-bleeding core outcomes',
        title:
          'Standardising outcome reporting for clinical trials of interventions for heavy menstrual bleeding: Development of a core outcome set.',
        type: 'Original core-outcome consensus development for heavy menstrual bleeding',
        url: 'https://doi.org/10.1111/1471-0528.17473',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C12',
    domain: 'symptoms_anemia',
    claim: 'Fatigue or self-reported heavy bleeding cannot diagnose anemia.',
    confidence: 'Supported measurement distinction',
    basis:
      'R56uses codes, not hemoglobin measurements; clinical anemia and iron deficiency require their own assessment.',
    limits: 'No individual diagnostic rule or general anemia prevalence from app logs.',
    productRule: 'Offer dated clinical-result capture when available; keep missing tests unknown.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R05',
        label: 'Ricci et al., 2022 — anemia',
        title: 'Characteristics of Submucous Myomas and the Risk of Anemia.',
        type: 'Original retrospective clinical study',
        url: 'https://europepmc.org/article/MED/36422191',
        depth: 'Full main text read',
      },
      {
        id: 'R56',
        label: 'R56 — Burden of anemia in women with uterine fibroid-associated heavy menstrual bleeding',
        title: 'Burden of anemia in women with uterine fibroid-associated heavy menstrual bleeding',
        type: 'Retrospective commercial insurance claims descriptive matched-cohort analysis',
        url: 'https://doi.org/10.1016/j.xagr.2026.100652',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C13',
    domain: 'symptoms_anemia',
    claim: 'Coded anemia and bleeding accompany higher care burden in one insured claims setting.',
    confidence: 'Supported descriptive association',
    basis:
      'Anemia codes occurred in 32.0% and 35.3% of selected bleeding groups; there were no laboratory or anatomy data and matching addressed only age.',
    limits:
      'Billing and recognition bias, coverage restrictions, confounding and sponsor funding limit interpretation.',
    productRule: 'Use as rationale for clinical conversations, rather than calculating an individual surgery risk.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R56',
        label: 'R56 — Burden of anemia in women with uterine fibroid-associated heavy menstrual bleeding',
        title: 'Burden of anemia in women with uterine fibroid-associated heavy menstrual bleeding',
        type: 'Retrospective commercial insurance claims descriptive matched-cohort analysis',
        url: 'https://doi.org/10.1016/j.xagr.2026.100652',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C14',
    domain: 'patient_experience',
    claim: 'Some participants describe dismissal, normalization of symptoms and unmet communication needs.',
    confidence: 'Supported situated experience',
    basis: 'Qualitative studies and selected surveys address different populations; M35 remains partial.',
    limits: 'Not representative frequencies or proof that software removes structural inequity.',
    productRule: 'Preserve the user concern and provide a low-burden way to bring it to care.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R16',
        label: 'Borah et al., 2013 — burden and preferences',
        title: 'The impact of uterine leiomyomas: a national survey of affected women.',
        type: 'Original cross-sectional online survey',
        url: 'https://europepmc.org/article/MED/23891629',
        depth: 'Full main text read',
      },
      {
        id: 'R33',
        label: 'Orellana et al., 2024 — menstruation, communication and community experience',
        title:
          '“In our community, we normalize pain”: discussions around menstruation and uterine fibroids with Black women and Latinas.',
        type: 'Original qualitative community-engagement study',
        url: 'https://doi.org/10.1186/s12905-024-03008-z',
        depth: 'Full main text read',
      },
      {
        id: 'R52',
        label:
          'R52 — “Am I Truly Invisible?”: A Qualitative Study on Black Women’s Experiences of and Coping with Intersectional Invisibility in Uterine Fibroid Treatment',
        title:
          '“Am I Truly Invisible?”: A Qualitative Study on Black Women’s Experiences of and Coping with Intersectional Invisibility in Uterine Fibroid Treatment',
        type: 'Purposive qualitative interview study with community-partner thematic analysis',
        url: 'https://doi.org/10.1016/j.whi.2025.05.005',
        depth: 'Full main text read',
      },
      {
        id: 'M35',
        label: 'Ghant et al., 2016 — qualitative treatment-delay study.',
        title:
          'An Altered Perception of Normal: Understanding Causes for Treatment Delay in Women with Symptomatic Uterine Fibroids.',
        type: 'Unclassified in this audit',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4982946/',
        depth: 'Partly read',
      },
    ],
  },
  {
    claimId: 'C15',
    domain: 'patient_experience',
    claim: 'An appointment summary may be useful, but its benefit is still a product hypothesis.',
    confidence: 'Untested Sanelle benefit',
    basis: 'Patient studies identify needs; a registry design does not test this app.',
    limits: 'No Sanelle trial of comprehension, visit quality or health outcomes is in this library.',
    productRule: 'Test whether users discuss priority questions and leave with a documented plan.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R33',
        label: 'Orellana et al., 2024 — menstruation, communication and community experience',
        title:
          '“In our community, we normalize pain”: discussions around menstruation and uterine fibroids with Black women and Latinas.',
        type: 'Original qualitative community-engagement study',
        url: 'https://doi.org/10.1186/s12905-024-03008-z',
        depth: 'Full main text read',
      },
      {
        id: 'R52',
        label:
          'R52 — “Am I Truly Invisible?”: A Qualitative Study on Black Women’s Experiences of and Coping with Intersectional Invisibility in Uterine Fibroid Treatment',
        title:
          '“Am I Truly Invisible?”: A Qualitative Study on Black Women’s Experiences of and Coping with Intersectional Invisibility in Uterine Fibroid Treatment',
        type: 'Purposive qualitative interview study with community-partner thematic analysis',
        url: 'https://doi.org/10.1016/j.whi.2025.05.005',
        depth: 'Full main text read',
      },
      {
        id: 'T03',
        label: 'COMPARE-UF registry design, 2018 — registry design, not comparative treatment results.',
        title:
          'The Comparing Options for Management: PAtient-centered REsults for Uterine Fibroids (COMPARE-UF) registry: rationale and design.',
        type: 'Protocol / registry design with initial descriptive recruitment',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8889489/',
        depth: 'Protocol read in full',
      },
    ],
  },
  {
    claimId: 'C16',
    domain: 'risk_prevention',
    claim: 'Diet associations with diagnosed fibroid incidence do not show shrinkage of existing tumors.',
    confidence: 'Supported inferential boundary; partial source depth',
    basis:
      'Dairy estimates in a nurse cohort are observational; fruit, older dairy and alcohol originals remain unread.',
    limits: 'Confounding, detection and exposure measurement; no completed whole-diet cure trial here.',
    productRule: 'Separate incidence, growth, bleeding, pain and fertility in Learn.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R19',
        label: 'Orta et al., 2020 — dairy and nutrients',
        title: 'Dairy and related nutrient intake and risk of uterine leiomyoma: a prospective cohort study.',
        type: 'Original NHS II prospective cohort analysis',
        url: 'https://europepmc.org/article/MED/32086510',
        depth: 'Full main text read',
      },
      {
        id: 'M09',
        label: 'Wise et al., 2011 — fruit and vegetables.',
        title: 'Intake of fruit, vegetables, and carotenoids in relation to risk of uterine leiomyomata.',
        type: 'Unclassified in this audit',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3252555/',
        depth: 'Abstract or metadata only',
      },
      {
        id: 'M10',
        label: 'Wise et al., 2010 — dairy intake.',
        title: 'A prospective study of dairy intake and risk of uterine leiomyomata.',
        type: 'Unclassified in this audit',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2800240/',
        depth: 'Abstract or metadata only',
      },
      {
        id: 'M12',
        label: 'Wise et al., 2004 — alcohol, smoking and caffeine.',
        title:
          "Risk of uterine leiomyomata in relation to tobacco, alcohol and caffeine consumption in the Black Women's Health Study.",
        type: 'Unclassified in this audit',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1876785/',
        depth: 'Abstract or metadata only',
      },
    ],
  },
  {
    claimId: 'C17',
    domain: 'risk_prevention',
    claim: 'No reliably established whole-food regimen that removes fibroids was demonstrated in this bounded review.',
    confidence: 'Not established; absence is bounded',
    basis:
      'Supplement trials and measured vitamin D cohorts do not test the same exposure as meals; FRIEND is a protocol.',
    limits:
      'Not proof that no future dietary effect exists; all nutrition trials have not been comprehensively screened.',
    productRule: 'Position meals as practical nourishment; avoid hormone-balancing or fibroid-shrinkage promises.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R19',
        label: 'Orta et al., 2020 — dairy and nutrients',
        title: 'Dairy and related nutrient intake and risk of uterine leiomyoma: a prospective cohort study.',
        type: 'Original NHS II prospective cohort analysis',
        url: 'https://europepmc.org/article/MED/32086510',
        depth: 'Full main text read',
      },
      {
        id: 'R09',
        label: 'Davari Tanha et al., 2021 — vitamin D',
        title:
          'The Effect of Vitamin D Deficiency on Overgrowth of Uterine Fibroids: A Blinded Randomized Clinical Trial.',
        type: 'Original randomized trial',
        url: 'https://europepmc.org/article/MED/33687161',
        depth: 'Full main text read',
      },
      {
        id: 'R10',
        label: 'Roshdy et al., 2013 — green tea extract',
        title:
          'Treatment of symptomatic uterine fibroids with green tea extract: a pilot randomized controlled clinical study.',
        type: 'Original pilot randomized trial',
        url: 'https://europepmc.org/article/MED/23950663',
        depth: 'Full main text read',
      },
      {
        id: 'R41',
        label: 'Hajhashemi et al., 2019 — vitamin D intervention.',
        title:
          'The effect of vitamin D supplementation on the size of uterine leiomyoma in women with vitamin D deficiency.',
        type: 'Original blinded randomized supplementation trial',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31363390/',
        depth: 'Full main text read',
      },
      {
        id: 'R42',
        label: 'Harmon et al., 2022 — vitamin D in SELF.',
        title: 'Vitamin D and uterine fibroid growth, incidence, and loss: a prospective ultrasound study.',
        type: 'Original prospective SELF ultrasound cohort',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9771933/',
        depth: 'Full main text read',
      },
      {
        id: 'R51',
        label:
          'R51 — Association between hypovitaminosis D and uterine leiomyomas among women of reproductive age attending selected hospitals in Uganda: A multicenter cross-sectional study',
        title:
          'Association between hypovitaminosis D and uterine leiomyomas among women of reproductive age attending selected hospitals in Uganda: A multicenter cross-sectional study',
        type: 'Hospital-based multicentre cross-sectional study',
        url: 'https://doi.org/10.1371/journal.pone.0354584',
        depth: 'Full main text read',
      },
      {
        id: 'T02',
        label: 'Al-Hendy et al., 2024 — FRIEND protocol, not results.',
        title:
          'Fibroids and unexplained infertility treatment with epigallocatechin gallate: a natural compound in green tea (FRIEND) - protocol for a randomised placebo-controlled US multicentre clinical trial of EGCG to improve fertility in women with uterine fibroids.',
        type: 'Published FRIEND randomized trial protocol',
        url: 'https://bmjopen.bmj.com/content/14/1/e078989',
        depth: 'Protocol read in full',
      },
    ],
  },
  {
    claimId: 'C18',
    domain: 'risk_prevention',
    claim: 'Vitamin D evidence is heterogeneous across incidence, growth and supplementation studies.',
    confidence: 'Mixed/incomplete',
    basis:
      'Longitudinal growth associations, a selected deficient-participant trial and a Ugandan cross-sectional null finding answer different questions.',
    limits: 'Small trials, source discrepancies, residual confounding and genetic instrument assumptions.',
    productRule: 'Describe population and outcome; do not present deficiency management as a fibroid cure.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R09',
        label: 'Davari Tanha et al., 2021 — vitamin D',
        title:
          'The Effect of Vitamin D Deficiency on Overgrowth of Uterine Fibroids: A Blinded Randomized Clinical Trial.',
        type: 'Original randomized trial',
        url: 'https://europepmc.org/article/MED/33687161',
        depth: 'Full main text read',
      },
      {
        id: 'R34',
        label: 'Guo et al., 2022 — vitamin D Mendelian randomization',
        title: 'The association between vitamin D and uterine fibroids: A Mendelian randomization study.',
        type: 'Original genetic instrumental-variable analysis',
        url: 'https://doi.org/10.3389/fgene.2022.1013192',
        depth: 'Full main text read',
      },
      {
        id: 'R41',
        label: 'Hajhashemi et al., 2019 — vitamin D intervention.',
        title:
          'The effect of vitamin D supplementation on the size of uterine leiomyoma in women with vitamin D deficiency.',
        type: 'Original blinded randomized supplementation trial',
        url: 'https://pubmed.ncbi.nlm.nih.gov/31363390/',
        depth: 'Full main text read',
      },
      {
        id: 'R42',
        label: 'Harmon et al., 2022 — vitamin D in SELF.',
        title: 'Vitamin D and uterine fibroid growth, incidence, and loss: a prospective ultrasound study.',
        type: 'Original prospective SELF ultrasound cohort',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9771933/',
        depth: 'Full main text read',
      },
      {
        id: 'R51',
        label:
          'R51 — Association between hypovitaminosis D and uterine leiomyomas among women of reproductive age attending selected hospitals in Uganda: A multicenter cross-sectional study',
        title:
          'Association between hypovitaminosis D and uterine leiomyomas among women of reproductive age attending selected hospitals in Uganda: A multicenter cross-sectional study',
        type: 'Hospital-based multicentre cross-sectional study',
        url: 'https://doi.org/10.1371/journal.pone.0354584',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C19',
    domain: 'risk_prevention',
    claim: 'EGCGpilot findings do not establish that drinking tea or eating certain meals treats fibroids.',
    confidence: 'Promising but limited; translation unestablished',
    basis:
      'An extract intervention differs from food; the pilot is small and FRIEND provides design rather than results.',
    limits: 'Reproductive benefit, durable effects and broad safety are not demonstrated.',
    productRule: 'Keep supplements distinct from ingredients and pending trials distinct from results.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R10',
        label: 'Roshdy et al., 2013 — green tea extract',
        title:
          'Treatment of symptomatic uterine fibroids with green tea extract: a pilot randomized controlled clinical study.',
        type: 'Original pilot randomized trial',
        url: 'https://europepmc.org/article/MED/23950663',
        depth: 'Full main text read',
      },
      {
        id: 'T02',
        label: 'Al-Hendy et al., 2024 — FRIEND protocol, not results.',
        title:
          'Fibroids and unexplained infertility treatment with epigallocatechin gallate: a natural compound in green tea (FRIEND) - protocol for a randomised placebo-controlled US multicentre clinical trial of EGCG to improve fertility in women with uterine fibroids.',
        type: 'Published FRIEND randomized trial protocol',
        url: 'https://bmjopen.bmj.com/content/14/1/e078989',
        depth: 'Protocol read in full',
      },
    ],
  },
  {
    claimId: 'C20',
    domain: 'risk_prevention',
    claim: "Environmental associations cannot identify the cause of one person's fibroids.",
    confidence: 'Mixed/observational',
    basis: 'Exposure timing, mixture scales and detection differ; the R47 case-cohort model is unweighted.',
    limits: 'Residual confounding, selection, exposure error and independent replication gaps.',
    productRule: 'Do not blame users for foods, products or body weight.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R20',
        label: 'Wise et al., 2026 — hair products',
        title:
          'Use of chemical hair straighteners in relation to incidence and growth of uterine leiomyomata: a prospective ultrasound study.',
        type: 'Original SELF cohort analysis',
        url: 'https://europepmc.org/article/MED/41469322',
        depth: 'Full main text read',
      },
      {
        id: 'R47',
        label: 'SELF chemical-mixture study, 2024.',
        title:
          'Non-persistent endocrine disrupting chemical mixtures and uterine leiomyomata in the study of environment, lifestyle and fibroids (SELF).',
        type: 'Peer-reviewed original research report',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11254384/',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C21',
    domain: 'medical_management',
    claim: 'Symptom reduction and tumor-volume reduction are different treatment outcomes.',
    confidence: 'Supported outcome distinction',
    basis:
      'LIBERTY improved bleeding response without a statistically clear largest-tumor volume contrast; the tranexamic acid analysis targets bleeding.',
    limits: 'These trials do not establish that every treatment suits every reproductive setting.',
    productRule: 'Show what each option aims to improve and what it has not demonstrated.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'G03',
        label: 'FIGO 2025 medical treatment',
        title: 'Medical treatment of fibroids: FIGO best practice guidance.',
        type: 'Clinical narrative guidance',
        url: 'https://europepmc.org/article/MED/40927887',
        depth: 'Full main text read',
      },
      {
        id: 'R26',
        label: 'Al-Hendy et al., 2021 — original LIBERTY trials',
        title: 'Treatment of Uterine Fibroid Symptoms with Relugolix Combination Therapy.',
        type: 'Original two-trial randomized placebo-controlled report',
        url: 'https://europepmc.org/article/MED/33596357',
        depth: 'Full main text read',
      },
      {
        id: 'R44',
        label: 'Japanese linzagolix–leuprorelin trial, 2026.',
        title:
          'Linzagolix versus leuprorelin in Japanese women with uterine leiomyomas: a phase 3, randomized, active-controlled, non-inferiority trial.',
        type: 'Peer-reviewed original research report',
        url: 'https://pubmed.ncbi.nlm.nih.gov/42406777/',
        depth: 'Full main text read',
      },
      {
        id: 'R46',
        label: 'Eder et al., 2013 — tranexamic acid.',
        title: 'Efficacy and safety of oral tranexamic acid in women with heavy menstrual bleeding and fibroids.',
        type: 'Peer-reviewed original research report',
        url: 'https://pubmed.ncbi.nlm.nih.gov/23656203/',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C22',
    domain: 'medical_management',
    claim: 'Relugolix combination therapy reduced measured bleeding versus placebo inLIBERTY.',
    confidence: 'Supported randomized result; appraisal incomplete',
    basis:
      'At 24 weeks, responses were 73% versus 19% and 71% versus 15%; supplement and protocol gaps and sponsor analysis remain.',
    limits: 'Trial eligibility, missingness and long-term or reproductive applicability limit transfer.',
    productRule: 'Describe the trial and prompt an options discussion; do not prescribe in the app.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R26',
        label: 'Al-Hendy et al., 2021 — original LIBERTY trials',
        title: 'Treatment of Uterine Fibroid Symptoms with Relugolix Combination Therapy.',
        type: 'Original two-trial randomized placebo-controlled report',
        url: 'https://europepmc.org/article/MED/33596357',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C23',
    domain: 'medical_management',
    claim: 'A noninferiority result applies to its specified endpoint and margin.',
    confidence: 'Supported endpoint-specific result',
    basis: 'The Japanese 24-week comparison used a 15-percentage-point margin and a specified PBAC window.',
    limits: 'No equivalence inference across all outcomes; bone loss and recovery matter; no TTC benefit demonstrated.',
    productRule: 'Keep bleeding, bone health, durability and fertility separate.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R44',
        label: 'Japanese linzagolix–leuprorelin trial, 2026.',
        title:
          'Linzagolix versus leuprorelin in Japanese women with uterine leiomyomas: a phase 3, randomized, active-controlled, non-inferiority trial.',
        type: 'Peer-reviewed original research report',
        url: 'https://pubmed.ncbi.nlm.nih.gov/42406777/',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C24',
    domain: 'medical_management',
    claim: 'Tranexamic acid evidence addresses heavy bleeding rather than eradication of fibroids.',
    confidence: 'Supported symptom-treatment distinction',
    basis: 'A post hoc pooled fibroid subgroup from randomized bleeding studies used measured blood loss.',
    limits:
      'Nonhormonal contraception was required; this was not a TTC outcome trial. Parent reports are not automatically counted as read.',
    productRule: 'Make a clinician question available without promising shrinkage or pregnancy compatibility.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R46',
        label: 'Eder et al., 2013 — tranexamic acid.',
        title: 'Efficacy and safety of oral tranexamic acid in women with heavy menstrual bleeding and fibroids.',
        type: 'Peer-reviewed original research report',
        url: 'https://pubmed.ncbi.nlm.nih.gov/23656203/',
        depth: 'Full main text read',
      },
      {
        id: 'G03',
        label: 'FIGO 2025 medical treatment',
        title: 'Medical treatment of fibroids: FIGO best practice guidance.',
        type: 'Clinical narrative guidance',
        url: 'https://europepmc.org/article/MED/40927887',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C25',
    domain: 'medical_management',
    claim: 'Control during medication use need not persist after stopping it.',
    confidence: 'Supported durability concern',
    basis: 'Selected extension and withdrawal populations differ from the initial randomized participants.',
    limits: 'Relapse estimates depend on eligibility and follow-up; not a permanent cure claim.',
    productRule: 'Record start and stop dates and intended review, rather than only ever-used status.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R07',
        label: 'Al-Hendy et al., 2022 — relugolix combination extension',
        title: 'Long-term Relugolix Combination Therapy for Symptomatic Uterine Leiomyomas.',
        type: 'Original open-label extension',
        url: 'https://europepmc.org/article/MED/36357960',
        depth: 'Full main text read',
      },
      {
        id: 'R31',
        label: 'Donnez et al., 2025 — PRIMROSE extension and withdrawal',
        title:
          'Linzagolix with and without hormonal add-back therapy for symptomatic uterine fibroids: PRIMROSE 1 & 2 long-term extension and withdrawal study.',
        type: 'Original randomized-trial extension and treatment-free follow-up',
        url: 'https://doi.org/10.1016/j.fertnstert.2025.06.016',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C26',
    domain: 'procedures',
    claim: 'Myomectomy and embolization have comparative symptom evidence, but no universal winner.',
    confidence: 'Supported tradeoffs; question-dependent',
    basis:
      'FEMME two-year quality of life favored myomectomy; later follow-up was imprecise and repeat-treatment and reproductive outcomes differ.',
    limits: 'Missing questionnaires, crossover, eligibility and procedure type constrain application.',
    productRule: 'Present options against individual goals rather than a single best-treatment badge.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R40',
        label: 'Daniels et al., 2022 — full FEMME report',
        title:
          'Uterine artery embolisation versus myomectomy for premenopausal women with uterine fibroids wishing to avoid hysterectomy: the FEMME RCT.',
        type: 'Original randomized trial full NIHR report with economic evaluation',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9082260/',
        depth: 'Full main text read',
      },
      {
        id: 'R08',
        label: 'Sirkeci et al., 2023 — FEMME follow-up',
        title:
          'Effects on heavy menstrual bleeding and pregnancy of uterine artery embolization (UAE) or myomectomy for women with uterine fibroids wishing to avoid hysterectomy: The FEMME randomized controlled trial.',
        type: 'Original randomized-trial follow-up',
        url: 'https://europepmc.org/article/MED/36511801',
        depth: 'Full main text read',
      },
      {
        id: 'R25',
        label: 'Mitro et al., 2024 — long-term reintervention',
        title:
          'Long-Term Risk of Reintervention After Surgical Leiomyoma Treatment in an Integrated Health Care System.',
        type: 'Original health-system cohort analysis',
        url: 'https://europepmc.org/article/MED/38547478',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C27',
    domain: 'procedures',
    claim: "FIRSTT's primary comparison pooled randomized and preference recruitment.",
    confidence: 'Supported source/design correction',
    basis: 'Reinterventions were 13/43 versus 5/40; HR 2.81 (95% CI 1.01–7.79). The age-adjusted interval crossed one.',
    limits:
      '49% missing 24-month questionnaires, an older device, pregnancy-seeking exclusion and only eighteen later AMH samples.',
    productRule: 'Label the design correctly; do not equate ovarian biomarker changes with infertility.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R50',
        label:
          'R50 — FIRSTT Study: Randomized Controlled Trial of Uterine Artery Embolization Versus Focused Ultrasound',
        title: 'FIRSTT Study: Randomized Controlled Trial of Uterine Artery Embolization Versus Focused Ultrasound',
        type: 'Comparative intervention comprehensive cohort: randomized and preference arms pooled',
        url: 'https://doi.org/10.1016/j.ajog.2018.10.032',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C28',
    domain: 'procedures',
    claim: 'Ablation durability differs across selected studies and routine-care cohorts.',
    confidence: 'Heterogeneous evidence',
    basis:
      'SONATA and Dutch follow-up differ in selection, endpoint and practice; they were not randomized against each other.',
    limits: 'Efficacy exclusions, cohort overlap and planned subsequent procedures affect apparent failures.',
    productRule: 'State cohort and endpoint definitions with repeat-treatment figures.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R35',
        label: 'Lukes and Green, 2020 — SONATA three-year follow-up',
        title:
          'Three-Year Results of the SONATA Pivotal Trial of Transcervical Fibroid Ablation for Symptomatic Uterine Myomata.',
        type: 'Original prospective single-arm pivotal-trial follow-up',
        url: 'https://doi.org/10.1089/gyn.2020.0021',
        depth: 'Full main text read',
      },
      {
        id: 'R36',
        label: 'van der Meulen et al., 2022 — longer-term routine-care Sonata outcomes',
        title:
          'Long-term results of transcervical, intrauterine ultrasound-guided radiofrequency ablation of uterine fibroids with the Sonata System: a retrospective follow-up study.',
        type: 'Original retrospective single-centre procedural cohort',
        url: 'https://doi.org/10.1016/j.xagr.2022.100087',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C29',
    domain: 'procedures',
    claim: 'Repeat treatment is distinct from recurrence of symptoms or a new lesion.',
    confidence: 'Supported endpoint distinction',
    basis: 'Clinical procedure decisions depend on care access, preferences and follow-up.',
    limits: 'Procedure counts miss untreated symptoms and new tumors.',
    productRule: 'Use separate outcomes for symptoms, imaging and interventions.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R25',
        label: 'Mitro et al., 2024 — long-term reintervention',
        title:
          'Long-Term Risk of Reintervention After Surgical Leiomyoma Treatment in an Integrated Health Care System.',
        type: 'Original health-system cohort analysis',
        url: 'https://europepmc.org/article/MED/38547478',
        depth: 'Full main text read',
      },
      {
        id: 'R35',
        label: 'Lukes and Green, 2020 — SONATA three-year follow-up',
        title:
          'Three-Year Results of the SONATA Pivotal Trial of Transcervical Fibroid Ablation for Symptomatic Uterine Myomata.',
        type: 'Original prospective single-arm pivotal-trial follow-up',
        url: 'https://doi.org/10.1089/gyn.2020.0021',
        depth: 'Full main text read',
      },
      {
        id: 'R36',
        label: 'van der Meulen et al., 2022 — longer-term routine-care Sonata outcomes',
        title:
          'Long-term results of transcervical, intrauterine ultrasound-guided radiofrequency ablation of uterine fibroids with the Sonata System: a retrospective follow-up study.',
        type: 'Original retrospective single-centre procedural cohort',
        url: 'https://doi.org/10.1016/j.xagr.2022.100087',
        depth: 'Full main text read',
      },
      {
        id: 'R50',
        label:
          'R50 — FIRSTT Study: Randomized Controlled Trial of Uterine Artery Embolization Versus Focused Ultrasound',
        title: 'FIRSTT Study: Randomized Controlled Trial of Uterine Artery Embolization Versus Focused Ultrasound',
        type: 'Comparative intervention comprehensive cohort: randomized and preference arms pooled',
        url: 'https://doi.org/10.1016/j.ajog.2018.10.032',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C30',
    domain: 'reproduction',
    claim: 'Fibroid presence alone does not establish the cause of a miscarriage.',
    confidence: 'Supported causal restraint; heterogeneous populations',
    basis:
      'Age adjustment changed R02 miscarriage estimates; the normal-cavity AMIGOS population differs from general pregnancy cohorts.',
    limits: 'Very early unrecognized losses, IVF and large or cavity-distorting lesions are not uniformly represented.',
    productRule: 'Offer questions about anatomy and other relevant factors; avoid personal causation claims.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R02',
        label: 'Hartmann et al., 2017 — miscarriage',
        title: 'Prospective Cohort Study of Uterine Fibroids and Miscarriage Risk.',
        type: 'Original prospective cohort',
        url: 'https://europepmc.org/article/MED/28591761',
        depth: 'Full main text read',
      },
      {
        id: 'R14',
        label: 'Sundermann et al., 2021 — preterm birth',
        title: 'Uterine fibroids and risk of preterm birth by clinical subtypes: a prospective cohort study.',
        type: 'Original prospective cohort',
        url: 'https://europepmc.org/article/MED/34404387',
        depth: 'Full main text read',
      },
      {
        id: 'R48',
        label: 'AMIGOS secondary analysis, 2017 — non-cavity-distorting fibroids and IUI.',
        title:
          'Association of uterine fibroids and pregnancy outcomes after ovarian stimulation-intrauterine insemination for unexplained infertility.',
        type: 'Peer-reviewed original research report',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5472203/',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C31',
    domain: 'reproduction',
    claim: 'Evidence varies with cavity involvement, lesion characteristics and conception setting.',
    confidence: 'Mixed/incomplete',
    basis: 'OS-IUI, IVF and natural conception differ; M23 remains unread and the HELP fibroid subgroup is tiny.',
    limits: 'No general estimate for every small non-cavity-distorting fibroid is established here.',
    productRule: 'Preserve anatomy and reproductive setting; avoid deterministic forecasts.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'G02',
        label: 'FIGO 2025 diagnosis/classification',
        title: 'Diagnosis and classification of uterine fibroids.',
        type: 'Clinical narrative guidance',
        url: 'https://europepmc.org/article/MED/40970558',
        depth: 'Full main text read',
      },
      {
        id: 'R48',
        label: 'AMIGOS secondary analysis, 2017 — non-cavity-distorting fibroids and IUI.',
        title:
          'Association of uterine fibroids and pregnancy outcomes after ovarian stimulation-intrauterine insemination for unexplained infertility.',
        type: 'Peer-reviewed original research report',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5472203/',
        depth: 'Full main text read',
      },
      {
        id: 'M23',
        label: 'Deger et al., 2023 — myomectomy before repeat IVF.',
        title:
          'Effects of Non-Cavity-Distorting Intramural Fibroids on IVF Outcomes in Patients with Recurrent IVF Failure: Does Myomectomy Change IVF Outcomes ?',
        type: 'Unclassified in this audit',
        url: 'https://pubmed.ncbi.nlm.nih.gov/37701080/',
        depth: 'Abstract or metadata only',
      },
      {
        id: 'R32',
        label: 'Metwally et al., 2026 — HELP Fertility randomized study',
        title:
          'Removal of small fibroids and polyps in patients with infertility and recurrent miscarriage: The HELP Fertility? RCT.',
        type: 'Original prematurely terminated randomized trials with economic evaluation; NIHR synopsis',
        url: 'https://doi.org/10.3310/GJMM1915',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C32',
    domain: 'reproduction',
    claim: 'ULTRA shows pregnancy afterRFA, but does not establish equivalent fertility success.',
    confidence: 'Descriptive; very imprecisecomparison',
    basis:
      'There were 43 pregnancies in 37 of 539 participants; the trying denominator was absent. Live-birth OR 0.75 (95% CI 0.21–2.72).',
    limits: 'Nonrandomized, staggered recruitment, one rupture and insufficient events for rare-outcome comparisons.',
    productRule: 'Distinguish person history, pregnancies and people trying to conceive.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R49',
        label: 'Allen et al., 2024 — ULTRA pregnancy cohort.',
        title:
          'Pregnancy Outcomes After Laparoscopic Radiofrequency Ablation of Uterine Leiomyomas Compared With Myomectomy.',
        type: 'Unclassified in this audit',
        url: 'https://pubmed.ncbi.nlm.nih.gov/38422502/',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C33',
    domain: 'reproduction',
    claim: 'Removing a small lesion is not proven beneficial for every fertility scenario.',
    confidence: 'Uncertain/underpowered',
    basis:
      'HELP closed early with ten fibroid participants; FEMME had few pregnancies and was not powered for fertility.',
    limits: 'Pooled polyp/fibroid outcomes do not establish a fibroid-specific effect.',
    productRule: 'Do not equate removability or uterus preservation with improved live birth.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R32',
        label: 'Metwally et al., 2026 — HELP Fertility randomized study',
        title:
          'Removal of small fibroids and polyps in patients with infertility and recurrent miscarriage: The HELP Fertility? RCT.',
        type: 'Original prematurely terminated randomized trials with economic evaluation; NIHR synopsis',
        url: 'https://doi.org/10.3310/GJMM1915',
        depth: 'Full main text read',
      },
      {
        id: 'R40',
        label: 'Daniels et al., 2022 — full FEMME report',
        title:
          'Uterine artery embolisation versus myomectomy for premenopausal women with uterine fibroids wishing to avoid hysterectomy: the FEMME RCT.',
        type: 'Original randomized trial full NIHR report with economic evaluation',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9082260/',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C34',
    domain: 'measurement',
    claim: 'A custom symptom diary is not validated simply because it resembles established measures.',
    confidence: 'Supported measurement boundary',
    basis: 'Recall, wording, anchors, scoring, language and population matter.',
    limits: 'Custom Sanelle fields have no psychometric validation in this library.',
    productRule:
      'Use the diary for personal recall; use intact appropriate validated measures for research when justified.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R23',
        label: 'Coyne et al., 2019 — one-month UFS-QOL',
        title:
          'Psychometric validation of the 1-month recall Uterine Fibroid Symptom and Health-Related Quality of Life questionnaire (UFS-QOL).',
        type: 'Original psychometric analysis of two trial datasets',
        url: 'https://europepmc.org/article/MED/31444600',
        depth: 'Full main text read',
      },
      {
        id: 'R24',
        label: 'Najafiarab et al., 2023 — Persian UFS-QOL',
        title:
          'Validity and Reliability of The Persian Version of Uterine Fibroid Symptom and Health-Related Quality of Life Questionnaire: A Psychometric Study.',
        type: 'Original translation and psychometric study',
        url: 'https://europepmc.org/article/MED/38041461',
        depth: 'Full main text read',
      },
      {
        id: 'R29',
        label: 'Spies et al., 2002 — original UFS-QOL development',
        title:
          'The UFS-QOL, a new disease-specific symptom and health-related quality of life questionnaire for leiomyomata.',
        type: 'Original instrument development and psychometric validation',
        url: 'https://europepmc.org/article/MED/11814511',
        depth: 'Full main text read',
      },
      {
        id: 'R38',
        label: 'Cooper et al., 2023 — heavy-bleeding core outcomes',
        title:
          'Standardising outcome reporting for clinical trials of interventions for heavy menstrual bleeding: Development of a core outcome set.',
        type: 'Original core-outcome consensus development for heavy menstrual bleeding',
        url: 'https://doi.org/10.1111/1471-0528.17473',
        depth: 'Full main text read',
      },
      {
        id: 'S02',
        label:
          'S02 — Evaluating the psychometric measurement properties of patient-reported outcome measures for uterine fibroids using the Consensus-based Standards for the selection of health Measurement Instruments (COSMIN) guidelines: a systematic review',
        title:
          'Evaluating the psychometric measurement properties of patient-reported outcome measures for uterine fibroids using the Consensus-based Standards for the selection of health Measurement Instruments (COSMIN) guidelines: a systematic review',
        type: 'Systematic review of measurement properties using reported COSMIN/modifiedGRADE',
        url: 'https://doi.org/10.1136/bmjopen-2024-087443',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C35',
    domain: 'measurement',
    claim: 'Eleven-itemUFS-QOL is promising, but not ready for unqualified deployment.',
    confidence: 'Preliminary/internal validation; sourceissues',
    basis:
      'Internal sample splitting, no test–retest assessment and item-selection/denominator inconsistencies; S02 predates the short form.',
    limits:
      'Exact supplementary form, scoring, permissions and external target-population validation remain unchecked.',
    productRule: 'Evaluate before adopting; 70% fewer items does not establish 70% less time.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R54',
        label:
          'R54 — Development and Validation the Uterine Fibroid Symptom and Quality of Life Short-Form: Integrating Classical and Modern Test Theory',
        title:
          'Development and Validation the Uterine Fibroid Symptom and Quality of Life Short-Form: Integrating Classical and Modern Test Theory',
        type: 'Secondary psychometric development and internal split-sample validation',
        url: 'https://doi.org/10.2147/PPA.S594260',
        depth: 'Full main text read',
      },
      {
        id: 'S02',
        label:
          'S02 — Evaluating the psychometric measurement properties of patient-reported outcome measures for uterine fibroids using the Consensus-based Standards for the selection of health Measurement Instruments (COSMIN) guidelines: a systematic review',
        title:
          'Evaluating the psychometric measurement properties of patient-reported outcome measures for uterine fibroids using the Consensus-based Standards for the selection of health Measurement Instruments (COSMIN) guidelines: a systematic review',
        type: 'Systematic review of measurement properties using reported COSMIN/modifiedGRADE',
        url: 'https://doi.org/10.1136/bmjopen-2024-087443',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C36',
    domain: 'measurement',
    claim: 'Bleeding categories cannot be converted into millilitres with an invented rule.',
    confidence: 'Supported restraint; original validationgaps',
    basis: 'Pictorial validity depends on the instrument, products and setting; foundational originals remain unread.',
    limits: 'The current six-category diary is not calibrated to alkaline hematin measurements.',
    productRule: 'Show category frequencies and denominators; do not invent diagnostic PBAC thresholds.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'S01',
        label: 'Magnay et al., 2020 — pictorial bleeding measures',
        title:
          'Pictorial methods to assess heavy menstrual bleeding in research and clinical practice: a systematic literature review.',
        type: 'Systematic review of diagnostic-measurement validation',
        url: 'https://europepmc.org/article/MED/32041594',
        depth: 'Full main text read',
      },
      {
        id: 'R38',
        label: 'Cooper et al., 2023 — heavy-bleeding core outcomes',
        title:
          'Standardising outcome reporting for clinical trials of interventions for heavy menstrual bleeding: Development of a core outcome set.',
        type: 'Original core-outcome consensus development for heavy menstrual bleeding',
        url: 'https://doi.org/10.1111/1471-0528.17473',
        depth: 'Full main text read',
      },
      {
        id: 'M39',
        label: 'Higham et al., 1990 — pictorial blood-loss measurement.',
        title: 'Assessment of menstrual blood loss using a pictorial chart.',
        type: 'Unclassified in this audit',
        url: 'https://pubmed.ncbi.nlm.nih.gov/2400752/',
        depth: 'Abstract or metadata only',
      },
      {
        id: 'M40',
        label: 'Reid et al., 2000 — pictorial-chart counter-evidence.',
        title: 'Assessment of menstrual blood loss using a pictorial chart: a validation study.',
        type: 'Unclassified in this audit',
        url: 'https://pubmed.ncbi.nlm.nih.gov/10740326/',
        depth: 'Abstract or metadata only',
      },
    ],
  },
  {
    claimId: 'C37',
    domain: 'measurement',
    claim: 'Missing entries and unselected fields are unknown, not symptom-free days.',
    confidence: 'Analysis/design requirement',
    basis:
      'Recorded-day proportions differ from calendar-day prevalence; selection may depend on wellness, severity or disengagement.',
    limits: 'Sanelle missingness assumptions have not been validated.',
    productRule: 'Expose field-specific observations, unrecorded days and date windows.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R38',
        label: 'Cooper et al., 2023 — heavy-bleeding core outcomes',
        title:
          'Standardising outcome reporting for clinical trials of interventions for heavy menstrual bleeding: Development of a core outcome set.',
        type: 'Original core-outcome consensus development for heavy menstrual bleeding',
        url: 'https://doi.org/10.1111/1471-0528.17473',
        depth: 'Full main text read',
      },
      {
        id: 'T03',
        label: 'COMPARE-UF registry design, 2018 — registry design, not comparative treatment results.',
        title:
          'The Comparing Options for Management: PAtient-centered REsults for Uterine Fibroids (COMPARE-UF) registry: rationale and design.',
        type: 'Protocol / registry design with initial descriptive recruitment',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8889489/',
        depth: 'Protocol read in full',
      },
    ],
  },
  {
    claimId: 'C38',
    domain: 'access_equity',
    claim: 'Different treatment rates can reflect need, preferences, offered options or barriers.',
    confidence: 'Supported descriptive/qualitative distinction',
    basis:
      'The EHR lacks anatomy and decision processes; qualitative accounts add experiences without representative frequencies.',
    limits: 'A rate alone cannot determine discrimination or clinical appropriateness.',
    productRule: 'Ask what was offered and agreed; do not infer preferences from race.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R18',
        label: 'Mitro et al., 2025 — clinical diagnosis',
        title: 'Uterine Fibroid Diagnosis by Race and Ethnicity in an Integrated Health Care System.',
        type: 'Original health-system cohort',
        url: 'https://europepmc.org/article/MED/40172885',
        depth: 'Full main text read',
      },
      {
        id: 'R53',
        label: 'R53 — Treatment utilization after uterine fibroid diagnosis by race and ethnicity',
        title: 'Treatment utilization after uterine fibroid diagnosis by race and ethnicity',
        type: 'Electronic-health-record descriptive time-to-treatment cohort',
        url: 'https://doi.org/10.1177/15409996261420987',
        depth: 'Full main text read',
      },
      {
        id: 'R52',
        label:
          'R52 — “Am I Truly Invisible?”: A Qualitative Study on Black Women’s Experiences of and Coping with Intersectional Invisibility in Uterine Fibroid Treatment',
        title:
          '“Am I Truly Invisible?”: A Qualitative Study on Black Women’s Experiences of and Coping with Intersectional Invisibility in Uterine Fibroid Treatment',
        type: 'Purposive qualitative interview study with community-partner thematic analysis',
        url: 'https://doi.org/10.1016/j.whi.2025.05.005',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C39',
    domain: 'access_equity',
    claim: 'USclinical findings do not automatically describe all populations.',
    confidence: 'Supported applicability boundary',
    basis: 'South African tissue, Ugandan hospital and Chinese procedural/surgical studies add distinct evidence.',
    limits: 'Regional, language and low-resource coverage remains incomplete.',
    productRule: 'Use setting-specific explanations and validate with intended users.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R21',
        label: 'Mäkinen et al., 2011 — South African MED12 tumors',
        title: 'MED12 exon 2 mutations are common in uterine leiomyomas from South African patients.',
        type: 'Original molecular pathology study',
        url: 'https://europepmc.org/article/MED/22182697',
        depth: 'Full main text read',
      },
      {
        id: 'R51',
        label:
          'R51 — Association between hypovitaminosis D and uterine leiomyomas among women of reproductive age attending selected hospitals in Uganda: A multicenter cross-sectional study',
        title:
          'Association between hypovitaminosis D and uterine leiomyomas among women of reproductive age attending selected hospitals in Uganda: A multicenter cross-sectional study',
        type: 'Hospital-based multicentre cross-sectional study',
        url: 'https://doi.org/10.1371/journal.pone.0354584',
        depth: 'Full main text read',
      },
      {
        id: 'R54',
        label:
          'R54 — Development and Validation the Uterine Fibroid Symptom and Quality of Life Short-Form: Integrating Classical and Modern Test Theory',
        title:
          'Development and Validation the Uterine Fibroid Symptom and Quality of Life Short-Form: Integrating Classical and Modern Test Theory',
        type: 'Secondary psychometric development and internal split-sample validation',
        url: 'https://doi.org/10.2147/PPA.S594260',
        depth: 'Full main text read',
      },
      {
        id: 'R55',
        label:
          'R55 — Development and Validation of a Nomogram to Predict the Risk of Special Uterine Leiomyoma Pathological Types or Leiomyosarcoma in Postmenopausal Women: A Retrospective Study',
        title:
          'Development and Validation of a Nomogram to Predict the Risk of Special Uterine Leiomyoma Pathological Types or Leiomyosarcoma in Postmenopausal Women: A Retrospective Study',
        type: 'Retrospective diagnostic-prediction development with internal bootstrap validation',
        url: 'https://doi.org/10.2147/RMHP.S461773',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C40',
    domain: 'economics',
    claim: 'Economic burden models are not current individual treatment prices.',
    confidence: 'Supported economic distinction',
    basis: 'National scenario totals, trial QALY comparisons and paid claims use different perspectives and horizons.',
    limits: 'Attribution assumptions, sensitivity inputs and local prices are not fully verified.',
    productRule: 'Show provenance and currency year; avoid personal savings promises.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R30',
        label: 'Hazimeh and Coco et al., 2024 — US economic model',
        title:
          'The Annual Economic Burden of Uterine Fibroids in the United States (2010 Versus 2022): A Comparative Cost-Analysis.',
        type: 'Original comparative economic model using published inputs',
        url: 'https://europepmc.org/article/MED/39455488',
        depth: 'Full main text read',
      },
      {
        id: 'R40',
        label: 'Daniels et al., 2022 — full FEMME report',
        title:
          'Uterine artery embolisation versus myomectomy for premenopausal women with uterine fibroids wishing to avoid hysterectomy: the FEMME RCT.',
        type: 'Original randomized trial full NIHR report with economic evaluation',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9082260/',
        depth: 'Full main text read',
      },
      {
        id: 'R56',
        label: 'R56 — Burden of anemia in women with uterine fibroid-associated heavy menstrual bleeding',
        title: 'Burden of anemia in women with uterine fibroid-associated heavy menstrual bleeding',
        type: 'Retrospective commercial insurance claims descriptive matched-cohort analysis',
        url: 'https://doi.org/10.1016/j.xagr.2026.100652',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C41',
    domain: 'economics',
    claim: 'A costly disease does not demonstrate that this app saves money.',
    confidence: 'Untested Sanelle economic benefit',
    basis: 'Disease burden and procedure economics do not compare Sanelle with usual care.',
    limits: 'No app cost-effectiveness or cost-offset trial has been identified here.',
    productRule: 'Measure completion time, resource use and utility before claiming savings.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R30',
        label: 'Hazimeh and Coco et al., 2024 — US economic model',
        title:
          'The Annual Economic Burden of Uterine Fibroids in the United States (2010 Versus 2022): A Comparative Cost-Analysis.',
        type: 'Original comparative economic model using published inputs',
        url: 'https://europepmc.org/article/MED/39455488',
        depth: 'Full main text read',
      },
      {
        id: 'R40',
        label: 'Daniels et al., 2022 — full FEMME report',
        title:
          'Uterine artery embolisation versus myomectomy for premenopausal women with uterine fibroids wishing to avoid hysterectomy: the FEMME RCT.',
        type: 'Original randomized trial full NIHR report with economic evaluation',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9082260/',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C42',
    domain: 'infrastructure',
    claim: 'Patient-use data and a research dataset need distinct consent, purpose and quality controls.',
    confidence: 'Product/researchdesign inference',
    basis:
      'Core datasets and registry protocols specify variables; they do not justify automatic reuse of personal records.',
    limits:
      'No identified Sanelle health-research collection service; production infrastructure was not built in this pass.',
    productRule: 'Separate research opt-in and collect only justified variables with explicit outputs.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R28',
        label: 'Baird CE et al., 2022 — minimum registry dataset',
        title:
          'Development of a core minimum data set to advance real-world evidence generation for uterine fibroids treatment technologies.',
        type: 'Original expert/Delphi consensus and informatics development',
        url: 'https://europepmc.org/article/MED/36393887',
        depth: 'Full main text read',
      },
      {
        id: 'T03',
        label: 'COMPARE-UF registry design, 2018 — registry design, not comparative treatment results.',
        title:
          'The Comparing Options for Management: PAtient-centered REsults for Uterine Fibroids (COMPARE-UF) registry: rationale and design.',
        type: 'Protocol / registry design with initial descriptive recruitment',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8889489/',
        depth: 'Protocol read in full',
      },
      {
        id: 'R38',
        label: 'Cooper et al., 2023 — heavy-bleeding core outcomes',
        title:
          'Standardising outcome reporting for clinical trials of interventions for heavy menstrual bleeding: Development of a core outcome set.',
        type: 'Original core-outcome consensus development for heavy menstrual bleeding',
        url: 'https://doi.org/10.1111/1471-0528.17473',
        depth: 'Full main text read',
      },
    ],
  },
  {
    claimId: 'C43',
    domain: 'infrastructure',
    claim: 'An app cohort cannot estimate whole-population prevalence without a sampling strategy.',
    confidence: 'Supported methodological boundary',
    basis: 'App users, self-reported cases, clinic diagnoses and screened populations differ.',
    limits: 'Selection, access, coverage and follow-up limit transportability.',
    productRule: 'Describe enrolled participants and denominators; do not label app percentages global prevalence.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R39',
        label: 'Myers et al., 2012 — self-report validation',
        title: 'Self-report versus ultrasound measurement of uterine fibroid status.',
        type: 'Original diagnostic cross-sectional analysis of two cohorts',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3298676/',
        depth: 'Full main text read',
      },
      {
        id: 'R18',
        label: 'Mitro et al., 2025 — clinical diagnosis',
        title: 'Uterine Fibroid Diagnosis by Race and Ethnicity in an Integrated Health Care System.',
        type: 'Original health-system cohort',
        url: 'https://europepmc.org/article/MED/40172885',
        depth: 'Full main text read',
      },
      {
        id: 'T03',
        label: 'COMPARE-UF registry design, 2018 — registry design, not comparative treatment results.',
        title:
          'The Comparing Options for Management: PAtient-centered REsults for Uterine Fibroids (COMPARE-UF) registry: rationale and design.',
        type: 'Protocol / registry design with initial descriptive recruitment',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8889489/',
        depth: 'Protocol read in full',
      },
    ],
  },
  {
    claimId: 'C44',
    domain: 'infrastructure',
    claim: 'Cooked meal ticks do not establish consumption or a causal dietary effect.',
    confidence: 'Supported exposure/inferenceboundary',
    basis:
      'Progress records date and meal ID to mark preparation, rather than portions, substitutions or total consumption.',
    limits:
      'No dietary exposure validation or randomized meal trial; time-varying confounding and cycle effects matter.',
    productRule: 'Study meal utility first; exclude cooked markers from causal fibroid-effect claims.',
    verification:
      'Single-analyst synthesis;newR49–R56/S02direct main-source extraction;older reports use documented prior readings;independent checking pending',
    asOf: '2026-10-06',
    sources: [
      {
        id: 'R19',
        label: 'Orta et al., 2020 — dairy and nutrients',
        title: 'Dairy and related nutrient intake and risk of uterine leiomyoma: a prospective cohort study.',
        type: 'Original NHS II prospective cohort analysis',
        url: 'https://europepmc.org/article/MED/32086510',
        depth: 'Full main text read',
      },
      {
        id: 'R10',
        label: 'Roshdy et al., 2013 — green tea extract',
        title:
          'Treatment of symptomatic uterine fibroids with green tea extract: a pilot randomized controlled clinical study.',
        type: 'Original pilot randomized trial',
        url: 'https://europepmc.org/article/MED/23950663',
        depth: 'Full main text read',
      },
      {
        id: 'T02',
        label: 'Al-Hendy et al., 2024 — FRIEND protocol, not results.',
        title:
          'Fibroids and unexplained infertility treatment with epigallocatechin gallate: a natural compound in green tea (FRIEND) - protocol for a randomised placebo-controlled US multicentre clinical trial of EGCG to improve fertility in women with uterine fibroids.',
        type: 'Published FRIEND randomized trial protocol',
        url: 'https://bmjopen.bmj.com/content/14/1/e078989',
        depth: 'Protocol read in full',
      },
    ],
  },
];
