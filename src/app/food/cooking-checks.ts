/** Readable interpretations of the versioned check identifiers stored with database recipes. */
export interface CookingCheck {
  label: string;
  text: string;
  source: string;
}

const temperatures = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';
const cooking = 'https://www.gov.uk/government/publications/cooking-your-food/cooking-your-food';
const checks: Record<string, CookingCheck> = {
  poultry: {
    label: 'Poultry',
    text: 'Check the thickest part with a food thermometer: at least 74°C.',
    source: temperatures,
  },
  'ground-meat': { label: 'Ground beef', text: 'Check with a food thermometer: at least 71°C.', source: temperatures },
  'whole-cut-meat': {
    label: 'Whole-cut beef',
    text: 'Check with a food thermometer: at least 63°C, then rest for 3 minutes.',
    source: temperatures,
  },
  fish: {
    label: 'Fish',
    text: 'Check the thickest part: 63°C, or opaque flesh that separates easily with a fork.',
    source: temperatures,
  },
  shrimp: { label: 'Shrimp', text: 'Cook until pearly or white and opaque throughout.', source: temperatures },
  'whole-egg': { label: 'Eggs', text: 'Cook until both the white and yolk are firm.', source: temperatures },
  'egg-dish': {
    label: 'Egg dishes',
    text: 'Check with a food thermometer: at least 71°C; no liquid egg should remain.',
    source: temperatures,
  },
  casserole: {
    label: 'Casseroles',
    text: 'Check the centre with a food thermometer: at least 74°C.',
    source: temperatures,
  },
  reheating: {
    label: 'Reheating',
    text: 'Reheat leftovers to 74°C throughout; stir where possible to heat evenly.',
    source: temperatures,
  },
  'soft-egg': {
    label: 'Choosing a soft egg',
    text: 'For a runny yolk, use pasteurised shell eggs labelled suitable for undercooked use and follow the pack. Otherwise cook the white and yolk until firm.',
    source: 'https://www.fda.gov/food/buy-store-serve-safe-food/what-you-need-know-about-egg-safety',
  },
  'rice-storage': {
    label: 'Cooked rice',
    text: 'Chill quickly, ideally within 1 hour. Refrigerate and use within 24 hours. Reheat only once, until steaming hot throughout.',
    source: 'https://www.gov.uk/government/publications/home-food-fact-checker/home-food-fact-checker',
  },
  storage: {
    label: 'Keeping leftovers',
    text: 'Cool promptly in small portions and refrigerate. Use leftovers within 48 hours or freeze suitable portions. Follow shorter pack limits; cooked rice has a separate 24-hour limit.',
    source: cooking,
  },
};

export function cookingChecks(codes: readonly string[] | undefined): CookingCheck[] {
  return [...new Set(codes ?? [])].flatMap((code) => (checks[code] ? [checks[code]] : []));
}

const sourceLabels: Record<string, string> = {
  [temperatures]: 'FoodSafety.gov · safe cooking temperatures',
  [cooking]: 'Food Standards Agency · cooking and leftovers',
  'https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts': 'FoodSafety.gov · refrigerated storage',
  'https://www.gov.uk/government/publications/home-food-fact-checker/home-food-fact-checker':
    'Food Standards Agency · cooked rice and food handling',
  'https://www.fda.gov/food/buy-store-serve-safe-food/selecting-and-serving-produce-safely':
    'FDA · preparing fruit and vegetables',
  'https://www.fda.gov/food/buy-store-serve-safe-food/what-you-need-know-about-egg-safety': 'FDA · preparing eggs',
  'https://www.quakeroats.com/products/hot-cereals/old-fashioned-oats': 'Quaker · rolled-oat method',
  'https://media3.neff-international.com/Documents/MCDOC02081769_NEFF_Recipe_A4_Cod_Bake.pdf':
    'NEFF · cod oven-method reference',
  'https://www.bbcgoodfoodme.com/recipes/roasted-vegetables/': 'BBC Good Food · vegetable-roasting reference',
};

export function cookingSourceLabel(url: string): string {
  return sourceLabels[url] ?? url;
}
