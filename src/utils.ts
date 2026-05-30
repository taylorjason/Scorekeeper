import type { ScoreEntry } from './types';

export function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}

export function computeRoundDurations(entries: ScoreEntry[], matchStart: number): Map<number, number> {
  const roundEnds = new Map<number, number>();
  for (const e of entries) {
    const cur = roundEnds.get(e.roundNumber) ?? 0;
    if (e.createdAt > cur) roundEnds.set(e.roundNumber, e.createdAt);
  }
  const roundNums = [...roundEnds.keys()].sort((a, b) => a - b);
  const result = new Map<number, number>();
  let prevEnd = matchStart;
  for (const rn of roundNums) {
    const end = roundEnds.get(rn)!;
    result.set(rn, end - prevEnd);
    prevEnd = end;
  }
  return result;
}
