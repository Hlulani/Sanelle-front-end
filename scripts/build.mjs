// Production build. The API origin has no default: a placeholder or localhost baked into a
// release would ship an app that can't reach its server, so the build refuses to run without one.
//
//   SANELLE_API_ORIGIN=https://api.example.com npm run build
//   SANELLE_API_ORIGIN=http://localhost:8080 npm run build   # iOS Simulator against a local backend
//
// Extra arguments are passed to `ng build`.
import { spawnSync } from 'node:child_process';

const origin = process.env.SANELLE_API_ORIGIN?.replace(/\/+$/, '');
const local = /^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/;

if (!origin || !(/^https:\/\/[^/\s]+$/.test(origin) || local.test(origin))) {
  console.error(
    'Set SANELLE_API_ORIGIN to the backend this build should use, for example\n' +
      '  SANELLE_API_ORIGIN=https://api.example.com npm run build\n' +
      'It must be https://, or http:// on a local or emulator address for device testing.',
  );
  process.exit(1);
}
if (local.test(origin)) console.warn(`Building against a local backend (${origin}); don't release this build.`);

const result = spawnSync('npx', ['ng', 'build', '--define', `SANELLE_API_ORIGIN=${JSON.stringify(origin)}`, ...process.argv.slice(2)], {
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
