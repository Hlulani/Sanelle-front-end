/** Curated online photos, bundled locally. Sources and recipe matches share one catalogue. */
import { environment } from '../../environments/environment';
import catalogue from './meal-photo-catalogue.json';

export interface MealPhoto {
  src: string;
  alt: string;
  credit: string;
  match: 'exact' | 'close' | 'representative' | 'ingredient';
  source: string;
  license: string;
  licenseUrl: string;
  note?: string;
}

interface RecipePhotoMatch {
  photoKey: string;
  match?: MealPhoto['match'];
  note?: string;
}

export const PHOTO_LIBRARY = catalogue.photos as Record<string, MealPhoto>;
const matches = catalogue.recipes as Record<string, RecipePhotoMatch>;
export const MEAL_PHOTOS = Object.entries(matches).reduce<Record<string, MealPhoto>>((photos, [name, entry]) => {
  photos[name] = {
    ...PHOTO_LIBRARY[entry.photoKey],
    ...(entry.match ? { match: entry.match } : {}),
    ...(entry.note ? { note: entry.note } : {}),
  };
  return photos;
}, {});
export const FALLBACK_MEAL_PHOTO: MealPhoto = {
  ...PHOTO_LIBRARY[catalogue.fallbackPhotoKey],
  note: 'Meal inspiration. A photo of this recipe is not available yet.',
};

function normalizedName(name: string): string {
  return name
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en')
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ');
}

const normalizedPhotos = new Map(Object.entries(MEAL_PHOTOS).map(([name, photo]) => [normalizedName(name), photo]));

/** Deliberate recipe matches only; spelling/capitalisation differences do not lose the photo. */
export function photoFor(name: string | undefined | null): MealPhoto | null {
  return name ? (normalizedPhotos.get(normalizedName(name)) ?? null) : null;
}

export function backendMealImageSrc(imageUrl?: string | null): string | null {
  const url = imageUrl?.trim();
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (/^\/?assets\//.test(url)) return url.replace(/^\//, '');
  // Reject unsupported schemes and protocol-relative links instead of attaching the API host.
  if (/^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith('//')) return null;
  return environment.hostBaseUrl.replace(/\/$/, '') + '/' + url.replace(/^\/+/, '');
}

/** Backend photo, curated match, then neutral meal inspiration if neither is available. */
export function mealImageCandidates(name: string | undefined | null, imageUrl?: string | null): string[] {
  return [
    ...new Set(
      [backendMealImageSrc(imageUrl), photoFor(name)?.src, FALLBACK_MEAL_PHOTO.src].filter(
        (src): src is string => !!src,
      ),
    ),
  ];
}
