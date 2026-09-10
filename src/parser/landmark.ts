import type {LandmarkResult} from '../interfaces/index.js';

const PREPOSITIONS = [
  'in front of',
  'front of',
  'back of',
  'adjacent to',
  'near',
  'opposite',
  'opp.',
  'opp',
  'behind',
  'beside',
  'adjacent',
];

const CANON: Record<string, string> = {opp: 'opposite', 'opp.': 'opposite'};

function titleCase(phrase: string): string {
  return phrase.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function extractLandmark(segment: string): LandmarkResult {
  if (typeof segment !== 'string') {
    return {landmark: null, preposition: null, rest: null};
  }
  const trimmed = segment.trim();
  const lower = trimmed.toLowerCase();
  for (const prep of PREPOSITIONS) {
    if (lower === prep || lower.startsWith(prep + ' ')) {
      const rest = trimmed.slice(prep.length).trim();
      const canonPrep = titleCase(CANON[prep] ?? prep);
      return {
        landmark: rest ? `${canonPrep} ${rest}` : canonPrep,
        preposition: canonPrep,
        rest,
      };
    }
  }
  return {landmark: null, preposition: null, rest: null};
}
