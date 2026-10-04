import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const catalogue = JSON.parse(await readFile(path.join(root, 'src/app/shared/meal-photo-catalogue.json'), 'utf8'));
const recipeNames = Object.keys(catalogue.recipes);
assert.equal(recipeNames.length, 166, 'All current recipes have deliberate photo matches');
for (const [name, match] of Object.entries(catalogue.recipes)) {
  assert(catalogue.photos[match.photoKey], 'Missing photo match for ' + name);
}
let bytes = 0;
for (const [key, photo] of Object.entries(catalogue.photos)) {
  assert(/^assets\/meals\/[^/]+\.jpg$/.test(photo.src), 'Local photo path: ' + key);
  assert(photo.alt && photo.credit && photo.license, 'Photo metadata: ' + key);
  for (const field of ['source', 'licenseUrl']) assert.equal(new URL(photo[field]).protocol, 'https:', field + ': ' + key);
  const image = await readFile(path.join(root, 'src', photo.src));
  assert(image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff, 'Valid JPEG: ' + key);
  bytes += image.length;
}
assert(catalogue.photos[catalogue.fallbackPhotoKey], 'Future recipes have a neutral fallback');

const migrations = path.join(root, '../sanelle-back-end/src/main/resources/db/migration');
let backendAvailable = true;
try { await access(migrations); } catch { backendAvailable = false; }
if (backendAvailable) {
  const backendNames = new Set();
  for (const file of await readdir(migrations)) {
    if (!file.endsWith('.sql')) continue;
    const sql = await readFile(path.join(migrations, file), 'utf8');
    for (const insert of sql.matchAll(/INSERT INTO meals\b[^;]*;/gi)) {
      for (const match of insert[0].matchAll(/'((?:[^']|'')*)'\s*,\s*'(?:BREAKFAST|LUNCH|DINNER|SNACK)'/g)) {
        backendNames.add(match[1].replaceAll("''", "'"));
      }
    }
  }
  assert.equal(backendNames.size, recipeNames.length, 'Photo coverage matches the backend catalogue');
  for (const name of backendNames) assert(catalogue.recipes[name], 'Backend recipe has no photo: ' + name);
}
console.log(recipeNames.length + ' recipes covered; ' + Object.keys(catalogue.photos).length + ' valid local photos (' + (bytes / 1024 / 1024).toFixed(1) + ' MB)' + (backendAvailable ? '; backend catalogue checked.' : '.'));
