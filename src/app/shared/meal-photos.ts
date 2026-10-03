/**
 * Placeholder photos (Unsplash / Pexels licence) matched to specific recipes, keyed
 * by recipe name. Each shows the dish; "close" matches have a minor difference and
 * are listed in docs/design/image-credits.md. Recipes without one use the designed tile.
 */
import { environment } from '../../environments/environment';

export interface MealPhoto {
  src: string;
  alt: string;
  credit: string;
  /** "close" = clearly the same dish with a minor difference; see image-credits.md. */
  match: 'exact' | 'close';
}

export const MEAL_PHOTOS: Record<string, MealPhoto> = {
  "Apple Cinnamon Oatmeal": {
    src: 'assets/meals/apple-cinnamon-oatmeal.jpg',
    alt: "Apple Cinnamon Oatmeal",
    credit: "K8 / Unsplash",
    match: 'close',
  },
  "Apple with Almond Butter": {
    src: 'assets/meals/apple-with-almond-butter.jpg',
    alt: "Apple with Almond Butter",
    credit: "Aasiya Khan / Unsplash",
    match: 'close',
  },
  "Avocado Tomato Toast": {
    src: 'assets/meals/avocado-tomato-toast.jpg',
    alt: "Avocado Tomato Toast",
    credit: "Jasper Gribble / Unsplash",
    match: 'close',
  },
  "Baked Salmon with Sweet Potato": {
    src: 'assets/meals/baked-salmon-with-sweet-potato.jpg',
    alt: "Baked Salmon with Sweet Potato",
    credit: "Gu Ko / Pexels",
    match: 'close',
  },
  "Beef and Broccoli Stir-Fry with Ginger": {
    src: 'assets/meals/beef-and-broccoli-stir-fry-with-ginger.jpg',
    alt: "Beef and Broccoli Stir-Fry with Ginger",
    credit: "sheri silver / Unsplash",
    match: 'close',
  },
  "Boiled Eggs with Salt": {
    src: 'assets/meals/boiled-eggs-with-salt.jpg',
    alt: "Boiled Eggs with Salt",
    credit: "Faris Mohammed / Unsplash",
    match: 'exact',
  },
  "Buckwheat Pancakes with Blueberry Compote": {
    src: 'assets/meals/buckwheat-pancakes-with-blueberry-compote.jpg',
    alt: "Buckwheat Pancakes with Blueberry Compote",
    credit: "Sandra Seitamaa / Unsplash",
    match: 'close',
  },
  "Chia Seed Pudding with Mango and Coconut": {
    src: 'assets/meals/chia-seed-pudding-with-mango-and-coconut.jpg',
    alt: "Chia Seed Pudding with Mango and Coconut",
    credit: "VD Photography / Unsplash",
    match: 'close',
  },
  "Chickpea Coconut Curry": {
    src: 'assets/meals/chickpea-coconut-curry.jpg',
    alt: "Chickpea Coconut Curry",
    credit: "\u00c1lvaro Bernal / Unsplash",
    match: 'close',
  },
  "Chickpea Salad with Lemon Dressing": {
    src: 'assets/meals/chickpea-salad-with-lemon-dressing.jpg',
    alt: "Chickpea Salad with Lemon Dressing",
    credit: "dimitri.photography / Unsplash",
    match: 'close',
  },
  "Cucumber Feta Salad": {
    src: 'assets/meals/cucumber-feta-salad.jpg',
    alt: "Cucumber Feta Salad",
    credit: "Alesia Kozik / Pexels",
    match: 'close',
  },
  "Dark Chocolate and Almonds": {
    src: 'assets/meals/dark-chocolate-and-almonds.jpg',
    alt: "Dark Chocolate and Almonds",
    credit: "alishefi / Unsplash",
    match: 'exact',
  },
  "Edamame with Sea Salt": {
    src: 'assets/meals/edamame-with-sea-salt.jpg',
    alt: "Edamame with Sea Salt",
    credit: "Daniel Brubaker / Unsplash",
    match: 'exact',
  },
  "Egg Salad Lettuce Cups": {
    src: 'assets/meals/egg-salad-lettuce-cups.jpg',
    alt: "Egg Salad Lettuce Cups",
    credit: "Mike Art Visual Creator / Pexels",
    match: 'close',
  },
  "Garlic Lemon Chicken with Broccoli": {
    src: 'assets/meals/garlic-lemon-chicken-with-broccoli.jpg',
    alt: "Garlic Lemon Chicken with Broccoli",
    credit: "Pixabay / Pexels",
    match: 'exact',
  },
  "Greek Yogurt Parfait with Blueberries, Flaxseed, Honey": {
    src: 'assets/meals/greek-yogurt-parfait-with-blueberries-flaxseed-honey.jpg',
    alt: "Greek Yogurt Parfait with Blueberries, Flaxseed, Honey",
    credit: "Christopher Gaines / Pexels",
    match: 'close',
  },
  "Greek Yogurt with Honey, Cinnamon, and Pomegranate": {
    src: 'assets/meals/greek-yogurt-with-honey-cinnamon-and-pomegranate.jpg',
    alt: "Greek Yogurt with Honey, Cinnamon, and Pomegranate",
    credit: "Dan Tang / Unsplash",
    match: 'close',
  },
  "Hummus and Carrot Sticks": {
    src: 'assets/meals/hummus-and-carrot-sticks.jpg',
    alt: "Hummus and Carrot Sticks",
    credit: "Bora C / Pexels",
    match: 'close',
  },
  "Lentil Bolognese": {
    src: 'assets/meals/lentil-bolognese.jpg',
    alt: "Lentil Bolognese",
    credit: "Max Griss / Unsplash",
    match: 'close',
  },
  "Lentil Soup (Quick)": {
    src: 'assets/meals/lentil-soup.jpg',
    alt: "Lentil Soup (Quick)",
    credit: "Jovan Vasiljevi\u0107 / Pexels",
    match: 'close',
  },
  "Mediterranean Pasta Salad": {
    src: 'assets/meals/mediterranean-pasta-salad.jpg',
    alt: "Mediterranean Pasta Salad",
    credit: "Ayrat / Pexels",
    match: 'close',
  },
  "Mixed Berries with Walnuts": {
    src: 'assets/meals/mixed-berries-with-walnuts.jpg',
    alt: "Mixed Berries with Walnuts",
    credit: "Pexels user / Pexels",
    match: 'close',
  },
  "Oat Banana Pancakes (2-Ingredient)": {
    src: 'assets/meals/oat-banana-pancakes.jpg',
    alt: "Oat Banana Pancakes (2-Ingredient)",
    credit: "Kelsey Curtis / Unsplash",
    match: 'close',
  },
  "Overnight Oats with Chia and Berries": {
    src: 'assets/meals/overnight-oats-with-chia-and-berries.jpg',
    alt: "Overnight Oats with Chia and Berries",
    credit: "Livilla Latini / Pexels",
    match: 'close',
  },
  "Roasted Chickpeas (Quick)": {
    src: 'assets/meals/roasted-chickpeas.jpg',
    alt: "Roasted Chickpeas (Quick)",
    credit: "Zoshua Colah / Unsplash",
    match: 'exact',
  },
  "Salmon Rice Bowl": {
    src: 'assets/meals/salmon-rice-bowl.jpg',
    alt: "Salmon Rice Bowl",
    credit: "Ranya Obeidallah / Pexels",
    match: 'close',
  },
  "Shrimp Zucchini Noodles": {
    src: 'assets/meals/shrimp-zucchini-noodles.jpg',
    alt: "Shrimp Zucchini Noodles",
    credit: "Kenan Giffard / Pexels",
    match: 'close',
  },
  "Spinach and Mushroom Omelet with Olive Oil": {
    src: 'assets/meals/spinach-and-mushroom-omelet-with-olive-oil.jpg',
    alt: "Spinach and Mushroom Omelet with Olive Oil",
    credit: "Aleyna Yetkin / Pexels",
    match: 'close',
  },
  "Tomato Mozzarella Snack Plate": {
    src: 'assets/meals/tomato-mozzarella-plate.jpg',
    alt: "Tomato and mozzarella with olive oil on a white plate",
    credit: "Brina Blum / Unsplash",
    match: 'exact',
  },
  "Trail Mix Cup": {
    src: 'assets/meals/trail-mix-cup.jpg',
    alt: "Trail Mix Cup",
    credit: "Monaz Nazary / Unsplash",
    match: 'close',
  },
  "Turkey Meatballs with Tomato Sauce": {
    src: 'assets/meals/turkey-meatballs-with-tomato-sauce.jpg',
    alt: "Turkey Meatballs with Tomato Sauce",
    credit: "Cookie Marenco / Pexels",
    match: 'exact',
  },
  "Veggie Fried Rice (Egg)": {
    src: 'assets/meals/veggie-fried-rice.jpg',
    alt: "Veggie Fried Rice (Egg)",
    credit: "Studio D7 / Pexels",
    match: 'close',
  },
  "Walnut and Date Energy Balls": {
    src: 'assets/meals/walnut-and-date-energy-balls.jpg',
    alt: "Walnut and Date Energy Balls",
    credit: "Livilla Latini / Pexels",
    match: 'close',
  },
};

export function photoFor(name: string | undefined | null): MealPhoto | null {
  return (name && MEAL_PHOTOS[name]) || null;
}

/**
 * The image to show for a meal: a photo stored with the recipe on the backend if
 * there is one, otherwise a matched placeholder photo, otherwise null (designed tile).
 */
export function mealImageSrc(name: string | undefined | null, imageUrl?: string | null): string | null {
  if (imageUrl) return imageUrl.startsWith('http') ? imageUrl : environment.hostBaseUrl + imageUrl;
  return photoFor(name)?.src ?? null;
}
