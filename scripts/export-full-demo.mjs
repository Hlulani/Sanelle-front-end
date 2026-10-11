import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('docs/demo/deployed-ai');
const ffmpeg = process.env.SANELLE_FFMPEG ?? 'ffmpeg';
// Normal-speed excerpts retain each action and its visible result, while removing
// repetitive typing and idle time from the original live recording.
const journeys = [
  ['Check-ins: symptoms, impact and two personal notes', [[11, 18], [25, 43], [55, 69], [79, 86]]],
  ['AI suggestions: consent, grounded questions, edit and add, research match', [[88, 135], [148, 174], [182, 192]]],
  ['Appointment: AI draft, review, edit and save', [[200, 238], [252, 260], [299, 309]]],
  ['Report: on-device reading, check measurements, confirm and save', [[317, 337], [343, 360], [370, 391]]],
  ['Research: published summaries, evidence limits and sources', [[405, 412], [419, 428], [434, 444]]],
];
const run = (args) => {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`ffmpeg failed: ${result.status}`);
};
const parts = [];
const chapters = [];
let elapsed = 0;
for (const [title, ranges] of journeys) {
  const start = elapsed;
  for (const [from, to] of ranges) {
    const file = `.full-cut-${parts.length}.mp4`;
    run(['-ss', String(from), '-i', path.join(root, 'full-recording.webm'), '-t', String(to - from),
      '-vf', 'crop=466:922:658:58', '-r', '25', '-c:v', 'libx264', '-preset', 'medium',
      '-crf', '18', '-pix_fmt', 'yuv420p', '-an', path.join(root, file)]);
    parts.push(file);
    elapsed += to - from;
  }
  chapters.push({ title, start, end: elapsed });
}
const safety = '.full-cut-safety.mp4';
run(['-i', path.join(root, '05-safety-talking-points.mp4'), '-t', '12', '-r', '25',
  '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-an', path.join(root, safety)]);
parts.push(safety);
chapters.push({ title: 'Safety checks — talking points', start: elapsed, end: elapsed + 12 });
elapsed += 12;
if (elapsed >= 300) throw new Error('Full demo must be under five minutes');
const list = path.join(root, '.full-journey-clips.txt');
writeFileSync(list, parts.map(file => `file '${file}'`).join('\n') + '\n');
run(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart',
  path.join(root, 'sanelle-full-journeys-under-5-min.mp4')]);
const stamp = seconds => new Date(seconds * 1000).toISOString().slice(11, 23);
writeFileSync(path.join(root, 'sanelle-full-journeys-under-5-min.vtt'), 'WEBVTT\n\n' +
  chapters.map(c => `${stamp(c.start)} --> ${stamp(c.end)}\n${c.title}\n`).join('\n'));
writeFileSync(path.join(root, 'full-journeys-edit.json'), JSON.stringify({ durationSeconds: elapsed, journeys, chapters }, null, 2));
console.log(`Exported all journeys in ${elapsed} seconds.`);
