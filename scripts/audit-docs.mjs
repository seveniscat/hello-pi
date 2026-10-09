import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const files = ['README.md', 'talk/pi-sharing-manuscript.md', 'talk/demo-runbook.md', 'talk/presenter-cue-sheet.md', 'talk/qa-and-exercises.md', 'research/source-register.md'];
const texts = new Map(await Promise.all(files.map(async file => [file, await readFile(join(root, file), 'utf8')])));
const ids = new Set([...texts.get('research/source-register.md').matchAll(/<a id="([a-z]\d+)"/g)].map(m => m[1]));
const { scripts } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
let localLinks = 0, shellBlocks = 0, citations = 0, scriptReferences = 0;
for (const [file, text] of texts) {
  assert.equal([...text.matchAll(/^```/gm)].length % 2, 0, `${file}: unclosed code fence`);
  for (const [, url] of text.matchAll(/\]\((\/[^)]+)\)/g)) {
    const [path, anchor] = url.split('#');
    await access(path); localLinks++;
    if (path.endsWith('/research/source-register.md') && anchor) {
      assert.ok(ids.has(anchor), `Unknown source anchor: ${anchor}`); citations++;
    }
  }
  for (const [, script] of text.matchAll(/```bash\n([\s\S]*?)```/g)) {
    const result = spawnSync('bash', ['-n'], { input: script, encoding: 'utf8' });
    assert.equal(result.status, 0, `${file}: invalid shell syntax: ${result.stderr}`); shellBlocks++;
  }
  for (const [, name] of text.matchAll(/\bnpm run ((?:demo|check):[\w:-]+)/g)) {
    assert.ok(Object.hasOwn(scripts, name), `${file}: missing npm script ${name}`); scriptReferences++;
  }
  assert.ok(!/〔来源：/.test(text), `${file}: source-name placeholders remain`);
}

function range(value) {
  const match = /^(\d+):(\d+)–(\d+):(\d+)$/.exec(value);
  assert.ok(match, `Invalid time range: ${value}`);
  assert.ok(+match[2] < 60 && +match[4] < 60, `Invalid seconds: ${value}`);
  return [+match[1] + +match[2] / 60, +match[3] + +match[4] / 60];
}
function schedule(text, total, label) {
  const rows = [];
  let previous = 0;
  for (const line of text.split('\n')) {
    const cells = line.split('|').map(s => s.trim()).filter(Boolean);
    if (!/^\d /.test(cells[0] ?? '') || !/^\d+$/.test(cells[2] ?? '')) continue;
    const id = +cells[0][0], [start, end] = range(cells[1]), duration = +cells[2];
    assert.equal(id, rows.length, `${label}: missing or duplicate segment`);
    assert.equal(start, previous, `${label}: timing gap`);
    assert.ok(end > start, `${label}: empty or reversed segment`);
    assert.equal(end - start, duration, `${label}: duration mismatch`);
    rows.push({ id, start, end, duration }); previous = end;
  }
  assert.equal(rows.length, 10, `${label}: expected 10 segments`);
  assert.equal(previous, total, `${label}: wrong total duration`);
  return rows;
}
const manuscript = texts.get('talk/pi-sharing-manuscript.md');
const variants = [
  [75, manuscript.split('## 节奏总表')[1].split('## 0｜')[0]],
  [60, manuscript.split('## 附录 A｜')[1].split('## 附录 B｜')[0]],
  [90, manuscript.split('## 附录 B｜')[1].split('## 附录 C｜')[0]],
];
const schedules = {}, rowsByVariant = {};
for (const [minutes, text] of variants) {
  rowsByVariant[minutes] = schedule(text, minutes, `${minutes}-minute version`);
  schedules[minutes] = { segments: 10, minutes, contiguous: true };
}
const mainRows = rowsByVariant[75];
assert.deepEqual(schedule(texts.get('README.md'), 75, 'README'), mainRows, 'README timing differs from manuscript');
const headings = [...manuscript.matchAll(/^## (\d)｜([^｜]+)｜/gm)];
assert.equal(headings.length, 10);
let subsectionCount = 0;
for (const [i, heading] of headings.entries()) {
  const [start, end] = range(heading[2]);
  assert.deepEqual({ id: +heading[1], start, end, duration: end - start }, mainRows[i], 'Section heading differs from schedule');
  const body = manuscript.slice(heading.index, headings[i + 1]?.index ?? manuscript.indexOf('## 附录 A｜'));
  const subheads = [...body.matchAll(/^### ([^｜]+)｜/gm)];
  let cursor = start;
  for (const [, time] of subheads) {
    const [a, b] = range(time);
    assert.equal(a, cursor, 'Subsection timing gap');
    assert.ok(b > a && b <= end, 'Subsection outside parent');
    cursor = b; subsectionCount++;
  }
  if (subheads.length) assert.equal(cursor, end, 'Subsections do not cover parent');
}
let cueEnd = 0, cueSegments = 0;
for (const [, time] of texts.get('talk/presenter-cue-sheet.md').matchAll(/^\| (\d+:\d+–\d+:\d+) \|/gm)) {
  const [start, end] = range(time);
  assert.equal(start, cueEnd, 'Cue sheet timing gap');
  assert.ok(end > start, 'Cue sheet reversed range'); cueEnd = end; cueSegments++;
}
assert.equal(cueEnd, 75, 'Cue sheet must include the full Q&A');
const exercises = [...texts.get('talk/qa-and-exercises.md').matchAll(/^### [A-G]｜[^\n]+\+(\d+) 分/gm)];
assert.equal(exercises.length, 7);
assert.equal(exercises.reduce((sum, match) => sum + +match[1], 0), 15, '90-minute exercises must add 15 minutes');
const report = {
  referenceDate: '2026-10-09', checkedFiles: files, localLinks, citations, shellBlocks, scriptReferences, schedules,
  crossChecks: { readmeMatchesMain: true, headingsMatchMain: true, subsections: subsectionCount, cueSegments, cueMinutes: cueEnd, exerciseMinutes: 15 },
  totalCjkCharacters: [...manuscript.matchAll(/[\u4e00-\u9fff]/g)].length,
  note: 'Structure, references and syntax audit only; does not verify live URLs, factual truth, model quality or TUI behavior.',
};
await writeFile(join(root, 'verification/document-audit.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
