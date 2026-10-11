import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('docs/demo');
const ffmpeg = process.env.SANELLE_FFMPEG ?? 'ffmpeg';
const timestamp = (seconds) => new Date(seconds * 1000).toISOString().slice(11, 23);
for (const journey of ['health', 'food']) {
  const result = spawnSync(
    ffmpeg,
    [
      '-y',
      '-i',
      path.join(root, `${journey}-journey.webm`),
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '18',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-an',
      path.join(root, `${journey}-journey.mp4`),
    ],
    { stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  const { chapters } = JSON.parse(readFileSync(path.join(root, `${journey}-chapters.json`), 'utf8'));
  const captions = chapters.map(
    (chapter, index) =>
      `${timestamp(chapter.seconds)} --> ${timestamp(chapters[index + 1]?.seconds ?? chapter.seconds + 3)}\n${chapter.title}\n`,
  );
  writeFileSync(path.join(root, `${journey}-journey.vtt`), `WEBVTT\n\n${captions.join('\n')}`);
}
