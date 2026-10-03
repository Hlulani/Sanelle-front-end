const RANGE_QUANTITY = /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)(.*)$/;
const LEADING_QUANTITY = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)(.*)$/;
const PARENTHETICAL_NUMBER = /\(([^)]*?)(\d+(?:\.\d+)?)([^)]*)\)/;

const COMMON_FRACTIONS: [number, string][] = [
  [1 / 8, '1/8'],
  [1 / 4, '1/4'],
  [1 / 3, '1/3'],
  [1 / 2, '1/2'],
  [2 / 3, '2/3'],
  [3 / 4, '3/4'],
];

function parseFraction(fraction: string): number {
  const [numerator, denominator] = fraction.split('/').map(Number);
  return numerator / denominator;
}

function parseQuantityToken(token: string): number {
  if (token.includes(' ')) {
    const [whole, fraction] = token.split(' ');
    return Number(whole) + parseFraction(fraction);
  }
  if (token.includes('/')) {
    return parseFraction(token);
  }
  return Number(token);
}

function formatQuantity(value: number): string {
  const whole = Math.floor(value);
  const frac = value - whole;

  if (frac < 0.03) return `${whole}`;
  if (frac > 0.97) return `${whole + 1}`;

  const closest = COMMON_FRACTIONS.find(([fracValue]) => Math.abs(frac - fracValue) < 0.03);
  if (closest) {
    return whole > 0 ? `${whole} ${closest[1]}` : closest[1];
  }

  return `${Math.round(value * 100) / 100}`;
}

/** Scales a number inside parentheses too, e.g. " can (about 120 g)" -> " can (about 240 g)" at 2x.
 * Only the first parenthetical number is touched — recipe amounts never have more than one. */
function scaleParenthetical(text: string, multiplier: number): string {
  const match = text.match(PARENTHETICAL_NUMBER);
  if (!match) return text;

  const [full, before, numberStr, after] = match;
  const scaledNumber = formatQuantity(Number(numberStr) * multiplier);
  return text.replace(full, `(${before}${scaledNumber}${after})`);
}

/** Scales the leading numeric quantity in a recipe amount (e.g. "1/2 cup" -> "1 1/2 cup" at 3x).
 * Amounts with no leading number (e.g. "pinch", "to taste") pass through unchanged — recipes
 * are drafted as 1 serving, so this is a direct multiplier, not a per-serving lookup. */
export function scaleIngredientAmount(amount: string, multiplier: number): string {
  if (multiplier === 1) return amount;

  const trimmed = amount.trim();

  const rangeMatch = trimmed.match(RANGE_QUANTITY);
  if (rangeMatch) {
    const [, low, high, rest] = rangeMatch;
    const scaledLow = formatQuantity(Number(low) * multiplier);
    const scaledHigh = formatQuantity(Number(high) * multiplier);
    return `${scaledLow}-${scaledHigh}${scaleParenthetical(rest, multiplier)}`;
  }

  const match = trimmed.match(LEADING_QUANTITY);
  if (!match) return amount;

  const [, quantityToken, rest] = match;
  const scaled = parseQuantityToken(quantityToken) * multiplier;
  return `${formatQuantity(scaled)}${scaleParenthetical(rest, multiplier)}`;
}
