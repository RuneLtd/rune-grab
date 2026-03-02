const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const charVal = new Uint8Array(128);
for (let i = 0; i < B64.length; i++) charVal[B64.charCodeAt(i)] = i;

interface Mapping {
  genLine: number;
  genCol: number;
  srcIdx: number;
  srcLine: number;
  srcCol: number;
}

function decodeMappings(encoded: string): Mapping[] {
  const mappings: Mapping[] = [];
  let genLine = 0;
  let genCol = 0;
  let srcIdx = 0;
  let srcLine = 0;
  let srcCol = 0;
  let i = 0;
  const len = encoded.length;

  while (i < len) {
    const ch = encoded.charCodeAt(i);
    if (ch === 59) {
      genLine++;
      genCol = 0;
      i++;
    } else if (ch === 44) {
      i++;
    } else {
      const fields: number[] = [];
      while (i < len && encoded.charCodeAt(i) !== 59 && encoded.charCodeAt(i) !== 44) {
        let value = 0;
        let shift = 0;
        let digit: number;
        do {
          digit = charVal[encoded.charCodeAt(i++)];
          value += (digit & 31) << shift;
          shift += 5;
        } while (digit & 32);
        fields.push(value & 1 ? -(value >> 1) : value >> 1);
      }
      if (fields.length >= 4) {
        genCol += fields[0];
        srcIdx += fields[1];
        srcLine += fields[2];
        srcCol += fields[3];
        mappings.push({ genLine, genCol, srcIdx, srcLine, srcCol });
      } else if (fields.length >= 1) {
        genCol += fields[0];
      }
    }
  }

  return mappings;
}

interface ParsedMap {
  sources: string[];
  mappings: Mapping[];
}

const cache = new Map<string, ParsedMap | null>();
const inflight = new Map<string, Promise<ParsedMap | null>>();

async function fetchSourceMap(moduleUrl: string): Promise<ParsedMap | null> {
  if (cache.has(moduleUrl)) return cache.get(moduleUrl)!;
  if (inflight.has(moduleUrl)) return inflight.get(moduleUrl)!;

  const promise = (async (): Promise<ParsedMap | null> => {
    try {
      const res = await fetch(moduleUrl);
      if (!res.ok) return null;
      const text = await res.text();
      const match = text.match(/\/\/[#@]\s*sourceMappingURL=(.+?)(?:\s|$)/);
      if (!match) return null;
      let mapJson: string;
      const url = match[1];
      if (url.startsWith('data:')) {
        const b64 = url.split(',')[1];
        mapJson = atob(b64);
      } else {
        const mapUrl = new URL(url, moduleUrl).href;
        const mapRes = await fetch(mapUrl);
        if (!mapRes.ok) return null;
        mapJson = await mapRes.text();
      }

      const raw = JSON.parse(mapJson);
      const mappings = decodeMappings(raw.mappings || '');
      return { sources: raw.sources || [], mappings };
    } catch {
      return null;
    }
  })();

  inflight.set(moduleUrl, promise);
  const result = await promise;
  cache.set(moduleUrl, result);
  inflight.delete(moduleUrl);
  return result;
}

export interface ResolvedPosition {
  source: string;
  line: number;
  column: number;
}

/**
 * Resolve a generated (bundled) position back to the original source position.
 * @param moduleUrl - Full URL of the served module (e.g. http://localhost:5173/src/App.tsx?t=...)
 * @param genLine - 1-based line number in the bundled output
 * @param genCol - 0-based column number in the bundled output
 */
export async function resolveOriginalPosition(
  moduleUrl: string,
  genLine: number,
  genCol: number,
): Promise<ResolvedPosition | null> {
  const map = await fetchSourceMap(moduleUrl);
  if (!map || map.mappings.length === 0) return null;
  const targetLine = genLine - 1;
  let best: Mapping | null = null;
  for (const m of map.mappings) {
    if (m.genLine === targetLine) {
      if (m.genCol <= genCol) {
        if (!best || m.genCol > best.genCol) best = m;
      }
    }
    if (m.genLine > targetLine) break;
  }

  if (!best) return null;
  let source = map.sources[best.srcIdx] || '';
  try {
    source = new URL(source, moduleUrl).href;
  } catch {
  }
  return {
    source,
    line: best.srcLine + 1,
    column: best.srcCol,
  };
}

export function prewarmSourceMap(moduleUrl: string): void {
  fetchSourceMap(moduleUrl);
}
