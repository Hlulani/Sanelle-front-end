import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('docs/demo/deployed-ai');
const ffmpeg = process.env.SANELLE_FFMPEG ?? 'ffmpeg';
const manifest = JSON.parse(readFileSync(path.join(root, 'recording.json'), 'utf8'));
const input = path.join(root, 'full-recording.webm');
const stamp = (seconds) => new Date(Math.max(0, seconds) * 1000).toISOString().slice(11, 23);
const encode = (args) => {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};
const { phone } = manifest;
const crop = {
  x: Math.floor((phone.x - 24) / 2) * 2,
  y: Math.floor((phone.y - 24) / 2) * 2,
  width: Math.ceil((phone.width + 48) / 2) * 2,
  height: Math.ceil((phone.height + 48) / 2) * 2,
};
const filter = `crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`;
const codec = [
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
];
for (const clip of manifest.clips) {
  const duration = clip.end - clip.start;
  if (!(duration > 0)) throw new Error(`Incomplete clip: ${clip.id}`);
  encode([
    '-ss',
    String(clip.start),
    '-i',
    input,
    '-t',
    String(duration),
    '-vf',
    filter,
    ...codec,
    path.join(root, `${clip.id}.mp4`),
  ]);
  const captions = manifest.chapters.filter((c) => c.seconds >= clip.start && c.seconds < clip.end);
  writeFileSync(
    path.join(root, `${clip.id}.vtt`),
    `WEBVTT\n\n${captions
      .map(
        (c, i) =>
          `${stamp(c.seconds - clip.start)} --> ${stamp((captions[i + 1]?.seconds ?? clip.end) - clip.start)}\n${c.title}\n`,
      )
      .join('\n')}`,
  );
}
// A generated closing slide presents the supplied safety talking points. It is
// explicitly labelled and does not impersonate a live rejection in the app.
const font = path.resolve('src/assets/fonts/atlas/DejaVuSans.ttf');
const heading = path.join(root, '.safety-heading.txt');
writeFileSync(heading, 'Safety checks');
const cards = [
  'Drafts are checked\nUnsupported diagnoses, causes,\ncounts, quotes and unpublished\nreferences are filtered.',
  'A fallback remains\nIf nothing passes the checks,\nher own words and suggestions\nfrom records stay available.',
  'She chooses what is kept\nNothing is saved unless she\nselects Add or Save.',
];
const filters = [
  `drawbox=x=0:y=0:w=iw:h=80:color=0x74203F:t=fill`,
  `drawtext=fontfile=${font}:text=SANELLE AI:fontsize=24:fontcolor=white:x=28:y=24`,
  `drawtext=fontfile=${font}:textfile=${heading}:fontsize=30:fontcolor=0x301B23:x=28:y=115`,
  `drawtext=fontfile=${font}:text=Talking points:fontsize=16:fontcolor=0x74636A:x=28:y=165`,
];
for (const [index, text] of cards.entries()) {
  const file = path.join(root, `.safety-${index}.txt`);
  writeFileSync(file, text);
  const y = 220 + index * 190;
  filters.push(`drawbox=x=24:y=${y}:w=iw-48:h=170:color=0xF6E1E3:t=fill`);
  filters.push(
    `drawtext=fontfile=${font}:textfile=${file}:fontsize=18:line_spacing=10:fontcolor=0x301B23:x=40:y=${y + 22}`,
  );
}
encode([
  '-f',
  'lavfi',
  '-i',
  `color=c=0xF7F5F2:s=${crop.width}x${crop.height}:r=25:d=15`,
  '-vf',
  filters.join(','),
  ...codec,
  path.join(root, '05-safety-talking-points.mp4'),
]);
const main = manifest.clips.filter((c) => /^0[123]-/.test(c.id));
writeFileSync(
  path.join(root, '.main-clips.txt'),
  main.map((c) => `file '${c.id}.mp4'`).join('\n') + "\nfile '05-safety-talking-points.mp4'\n",
);
encode([
  '-f',
  'concat',
  '-safe',
  '0',
  '-i',
  path.join(root, '.main-clips.txt'),
  '-c',
  'copy',
  '-movflags',
  '+faststart',
  path.join(root, 'sanelle-ai-main-demo.mp4'),
]);
writeFileSync(
  path.join(root, 'export.json'),
  JSON.stringify(
    {
      crop,
      clips: manifest.clips.map((c) => ({ file: c.id + '.mp4', durationSeconds: +(c.end - c.start).toFixed(2) })),
      main: 'sanelle-ai-main-demo.mp4',
    },
    null,
    2,
  ),
);
console.log('Exported phone-frame clips and sanelle-ai-main-demo.mp4');
