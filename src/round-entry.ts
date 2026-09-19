// Shared round-entry logic used by both ActiveMatch (desktop) and ScoreInput
// (mobile full-screen) views: reading the round's form inputs into score
// entries, and the "who went out first" row re-sequencing.
import type { Player, ScoreEntry, ScoringMode } from './types';

export interface RoundEntryDraft {
  playerId: number;
  value: number;
  note?: string;
}

export interface CollectRoundEntriesResult {
  entries: RoundEntryDraft[];
  error?: string;
}

/** Total phase count for a phase10 game (defaults to 10 when no custom roundLabels). */
export function getTotalPhases(roundLabels: string[] | undefined): number {
  return roundLabels?.length ?? 10;
}

/** For phase10 mode: the current phase (1-based) for a player, derived from their
 *  saved entries. Phase advances when an entry's note has completed === true for
 *  that phase. Returns totalPhases + 1 once all phases are done. */
export function getPlayerCurrentPhase(entries: ScoreEntry[], playerId: number, totalPhases: number): number {
  const sorted = entries
    .filter(e => e.playerId === playerId)
    .sort((a, b) => a.roundNumber - b.roundNumber);
  let phase = 1;
  for (const e of sorted) {
    if (!e.note) continue;
    try {
      const data = JSON.parse(e.note) as { phase?: number; completed?: boolean };
      if (data.completed && data.phase === phase) {
        phase = Math.min(phase + 1, totalPhases + 1);
      }
    } catch { /* plain string note, e.g. 'first_out' */ }
  }
  return phase;
}

/** Rotate players so `selectedId` leads, preserving the original match order for
 *  everyone else (e.g. ABCD with C selected becomes CDAB). Returns null if the
 *  player isn't found. Pure - callers apply the result to the DOM. */
export function rotateForFirstOut(players: Player[], selectedId: string): Player[] | null {
  const idx = players.findIndex(p => String(p.id) === selectedId);
  if (idx === -1) return null;
  return [...players.slice(idx), ...players.slice(0, idx)];
}

/** Reorder the player row elements inside `container` (each expected to have a
 *  `data-player-id` attribute) to match `players`' order. Used both to apply a
 *  first-out rotation and to restore the original order when cleared. */
export function reorderPlayerRows(players: Player[], container: HTMLElement): void {
  const rows = Array.from(container.querySelectorAll<HTMLElement>('[data-player-id]'));
  const rowMap = new Map(rows.map(r => [r.dataset['playerId']!, r]));
  players.forEach(p => {
    const row = rowMap.get(String(p.id));
    if (row) container.appendChild(row);
  });
}

/** Handle a "who went out first" selection change: reorders the rows to a
 *  rotation starting at the selected player, zeroes their score input, and
 *  returns the player whose input should receive focus next (or null if the
 *  selection didn't match a known player). */
export function applyFirstOutSelection(
  players: Player[],
  container: HTMLElement,
  selectedId: string,
): Player | null {
  const rotated = rotateForFirstOut(players, selectedId);
  if (!rotated) return null;

  reorderPlayerRows(rotated, container);

  const input = document.getElementById(`score-input-${selectedId}`) as HTMLInputElement | null;
  if (input) input.value = '0';

  return rotated[1] ?? null;
}

/** Read the current round's form inputs into score entries, dispatching on
 *  scoring mode. Returns an error message (and no entries to save) when the
 *  inputs are incomplete or invalid. Assumes each player has a `score-input-${id}`
 *  element (a select for finish-order/phase10-penalty, a number input otherwise),
 *  phase10 also has a `completed-${id}` checkbox, and there is an optional
 *  `first-out-select` element. */
export function collectRoundEntries(
  mode: ScoringMode,
  players: Player[],
  matchEntries: ScoreEntry[],
  totalPhases: number,
): CollectRoundEntriesResult {
  const firstOutId = (document.getElementById('first-out-select') as HTMLSelectElement | null)?.value ?? '';

  if (mode === 'phase10') {
    const entries: RoundEntryDraft[] = [];
    for (const player of players) {
      const phase = getPlayerCurrentPhase(matchEntries, player.id!, totalPhases);
      if (phase > totalPhases) continue; // already completed all phases, skip
      const input = document.getElementById(`score-input-${player.id}`) as HTMLInputElement | null;
      const penaltyPts = parseFloat(input?.value ?? '0') || 0;
      const completed = (document.getElementById(`completed-${player.id}`) as HTMLInputElement | null)?.checked ?? false;
      const firstOut = firstOutId === String(player.id);
      const note = JSON.stringify({ phase, completed, ...(firstOut ? { firstOut: true } : {}) });
      entries.push({ playerId: player.id!, value: penaltyPts, note });
    }
    if (entries.length === 0) return { entries: [], error: 'All players have completed all phases' };
    return { entries };
  }

  if (mode === 'finish-order') {
    const entries: RoundEntryDraft[] = [];
    const positions = new Set<number>();
    for (const player of players) {
      const sel = document.getElementById(`score-input-${player.id}`) as HTMLSelectElement | null;
      const pos = parseInt(sel?.value ?? '', 10);
      if (!pos || isNaN(pos)) return { entries: [], error: `Set position for ${player.displayName}` };
      if (positions.has(pos)) return { entries: [], error: 'Each player must have a unique position' };
      positions.add(pos);
      entries.push({ playerId: player.id!, value: players.length - pos + 1 });
    }
    return { entries };
  }

  const entries: RoundEntryDraft[] = [];
  for (const player of players) {
    const input = document.getElementById(`score-input-${player.id}`) as HTMLInputElement | null;
    const val = parseFloat(input?.value ?? '0') || 0;
    const firstOut = firstOutId === String(player.id);
    entries.push({ playerId: player.id!, value: val, ...(firstOut ? { note: 'first_out' } : {}) });
  }
  return { entries };
}
