import type { StatRow } from './query-engine';

export interface CustomStat {
  id: string;
  name: string;
  description: string;
  code: string;         // JS function body; receives `rows: StatRow[]`
  createdAt: number;
}

export type CustomStatResult =
  | { type: 'number';  value: number }
  | { type: 'table';   rows: { label: string; value: number; color?: string }[] }
  | { type: 'text';    value: string }
  | { type: 'error';   message: string };

const LS_STATS_KEY = 'scorekeeper_custom_stats';
const LS_API_KEY   = 'scorekeeper_claude_api_key';

export function loadCustomStats(): CustomStat[] {
  try { return JSON.parse(localStorage.getItem(LS_STATS_KEY) ?? '[]') as CustomStat[]; }
  catch { return []; }
}

export function saveCustomStats(stats: CustomStat[]): void {
  localStorage.setItem(LS_STATS_KEY, JSON.stringify(stats));
}

export function loadApiKey(): string  { return localStorage.getItem(LS_API_KEY) ?? ''; }
export function saveApiKey(key: string): void {
  if (key) localStorage.setItem(LS_API_KEY, key);
  else localStorage.removeItem(LS_API_KEY);
}

// ─── Code generation ───────────────────────────────────────────────────────────

const SCHEMA_DESC = `interface StatRow {
  entryId: number;
  playerId: number;
  playerName: string;
  playerColor: string;      // hex like "#ef4444"
  matchId: number;
  gameId: number;
  gameName: string;
  nightId: number;
  nightDate: string;        // "YYYY-MM-DD"
  roundNumber: number;
  value: number;            // round score
  note?: string;
  entryCreatedAt: number;   // timestamp ms
  isFirstOut: boolean;      // first player to go out this round
  isWinner: boolean;        // did this player win the match?
  roundDuration?: number;   // ms; may be undefined
}`;

const SYSTEM_PROMPT = `You are a JavaScript code generator for a board game scorekeeper app.
Generate the body of a JavaScript function that receives \`rows\` (StatRow[]) and returns one of:
- A number (single aggregate value)
- An array of { label: string, value: number, color?: string } objects (ranked list, already sorted descending)
- A string (narrative answer)

StatRow schema:
${SCHEMA_DESC}

Rules:
- Output ONLY the raw JavaScript function body — no function declaration, no markdown fences, no explanation.
- The last statement must be a return statement.
- Use only standard JS (no import/require/fetch/async).
- Deduplicate rows where needed (e.g. one row per matchId+playerId for win counts).`;

export async function generateStatCode(
  description: string,
  apiKey: string,
  sampleRows: StatRow[],
): Promise<string> {
  const sample = JSON.stringify(sampleRows.slice(0, 5), null, 2);

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Stat to compute: "${description}"\n\nSample data (first 5 rows):\n${sample}\n\nGenerate the JavaScript function body now.`,
      }],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`API error ${resp.status}: ${body}`);
  }

  const data = await resp.json() as { content: Array<{ type: string; text: string }> };
  const text = data.content.find(c => c.type === 'text')?.text ?? '';
  // Strip any accidental markdown fences
  return text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
}

// ─── Evaluation ────────────────────────────────────────────────────────────────

export function evalCustomStat(code: string, rows: StatRow[]): CustomStatResult {
  try {
    // new Function is acceptable here — the user's own API key generates the code
    // and it runs locally against the user's own data.
    // eslint-disable-next-line no-new-func
    const fn = new Function('rows', code) as (r: StatRow[]) => unknown;
    const result = fn(rows);

    if (typeof result === 'number') return { type: 'number', value: result };
    if (typeof result === 'string') return { type: 'text', value: result };
    if (Array.isArray(result)) {
      const tableRows = (result as unknown[]).map(r => {
        const o = r as Record<string, unknown>;
        return {
          label: String(o['label'] ?? ''),
          value: Number(o['value'] ?? 0),
          color: typeof o['color'] === 'string' ? o['color'] : undefined,
        };
      });
      tableRows.sort((a, b) => b.value - a.value);
      return { type: 'table', rows: tableRows };
    }
    return { type: 'text', value: JSON.stringify(result) };
  } catch (err) {
    return { type: 'error', message: err instanceof Error ? err.message : String(err) };
  }
}
