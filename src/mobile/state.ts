import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.env.BOT_DATA_DIR || '/storage/1FC3-111D/discord';
const MOD_FILE = path.join(ROOT, 'moderation.json');
const HISTORY_FILE = path.join(ROOT, 'bridge-history.jsonl');

export type ModState = {
  warnings: Record<string, number>;
  muted: Record<string, string[]>;
};

function ensure() { fs.mkdirSync(ROOT, { recursive: true }); }

export function loadState(): ModState {
  ensure();
  try {
    const x = JSON.parse(fs.readFileSync(MOD_FILE, 'utf8'));
    return { warnings: x.warnings || {}, muted: x.muted || {} };
  } catch { return { warnings: {}, muted: {} }; }
}
export function saveState(s: ModState) {
  ensure();
  const tmp = MOD_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2));
  fs.renameSync(tmp, MOD_FILE);
}
export function appendHistory(entry: Record<string, unknown>) {
  ensure();
  fs.appendFileSync(HISTORY_FILE, JSON.stringify(entry) + '\n');
  pruneHistory();
}
export function readHistory(limit = 50): string[] {
  ensure(); pruneHistory();
  if (!fs.existsSync(HISTORY_FILE)) return [];
  return fs.readFileSync(HISTORY_FILE, 'utf8').trim().split('\n').filter(Boolean).slice(-limit);
}
function pruneHistory() {
  if (!fs.existsSync(HISTORY_FILE)) return;
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const lines = fs.readFileSync(HISTORY_FILE, 'utf8').split('\n').filter(Boolean);
  const kept = lines.filter(line => { try { return Number(JSON.parse(line).ts) >= cutoff; } catch { return false; } });
  fs.writeFileSync(HISTORY_FILE, kept.length ? kept.join('\n') + '\n' : '');
}
