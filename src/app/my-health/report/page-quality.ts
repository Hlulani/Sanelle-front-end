/**
 * Quick checks on a photographed page, run on this device. They are hints, not certainties:
 * each one says what might be wrong so she can decide whether to retake the photo.
 */
export interface PageQuality {
  blur: boolean;
  glare: boolean;
  croppedEdge: boolean;
  /** The photo couldn't be assessed, so nothing is claimed about it. */
  unavailable?: boolean;
}

export const QUALITY_MESSAGES: Record<keyof PageQuality, string> = {
  blur: 'This page may be blurry. Retake it if the words are hard to read.',
  glare: 'There may be glare on this page. Tilt the paper or move away from the light.',
  croppedEdge: 'Writing may be cut off at an edge. Fit the whole page in the photo.',
  unavailable: 'Sanelle couldn’t check this photo. Make sure the words are clear.',
};

export function qualityProblems(q: PageQuality | null): string[] {
  if (!q) return [];
  if (q.unavailable) return ['Sanelle couldn’t check this photo. Make sure the words are clear.'];
  return (Object.keys(QUALITY_MESSAGES) as (keyof PageQuality)[]).filter((k) => q[k]).map((k) => QUALITY_MESSAGES[k]);
}

/** Greyscale values (0–255), row by row. */
export interface Greyscale {
  width: number;
  height: number;
  values: Uint8ClampedArray | number[];
}

export function assessGreyscale(img: Greyscale): PageQuality {
  const { width, height, values } = img;
  const at = (x: number, y: number) => values[y * width + x];

  // Blur: sharp text has strong local contrast, so the Laplacian varies a lot.
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < height - 1; y++)
    for (let x = 1; x < width - 1; x++) {
      const lap = 4 * at(x, y) - at(x - 1, y) - at(x + 1, y) - at(x, y - 1) - at(x, y + 1);
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  const variance = n ? sumSq / n - (sum / n) ** 2 : 0;

  // Glare: a patch blown out to pure white, beyond the paper's own brightness.
  let blown = 0;
  for (let i = 0; i < values.length; i++) if (values[i] >= 252) blown++;
  const glare = blown / values.length > 0.12;

  // Cropped edge: dark marks touching a border strip that is otherwise paper-bright.
  const strip = Math.max(2, Math.round(Math.min(width, height) * 0.02));
  const edges: [number, number, number, number][] = [
    [0, 0, width, strip],
    [0, height - strip, width, height],
    [0, 0, strip, height],
    [width - strip, 0, width, height],
  ];
  const croppedEdge = edges.some(([x0, y0, x1, y1]) => {
    let ink = 0;
    let total = 0;
    let light = 0;
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const v = at(x, y);
        total++;
        if (v < 90) ink++;
        light += v;
      }
    return total > 0 && light / total > 170 && ink / total > 0.015;
  });

  return { blur: variance < 120, glare, croppedEdge };
}

/** Reads a photo into a small greyscale image and checks it. */
export async function assessPhoto(file: File): Promise<PageQuality | null> {
  if (!/^image\//.test(file.type)) return null;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 480 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(8, Math.round(bitmap.width * scale));
    canvas.height = Math.max(8, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const values = new Uint8ClampedArray(canvas.width * canvas.height);
    for (let i = 0; i < values.length; i++)
      values[i] = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
    return assessGreyscale({ width: canvas.width, height: canvas.height, values });
  } catch {
    return null;
  }
}

/** "Page 2 of 3" printed on the report, so a missing page can be noticed. */
export function statedPageCount(text: string): number | null {
  const counts = [...text.matchAll(/\bpage\s+\d+\s+(?:of|\/)\s+(\d+)\b/gi)].map((m) => Number(m[1]));
  return counts.length ? Math.max(...counts) : null;
}
