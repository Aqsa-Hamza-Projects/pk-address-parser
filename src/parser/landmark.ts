import type {LandmarkResult} from '../interfaces/index.js';

// English plus the Roman-Urdu forms people actually type on PK phones.
// Sorted longest-first, so a shorter preposition can never shadow a longer one
// it prefixes ("near" vs "near by") — `extractLandmark` takes the first hit,
// so ordering is correctness, not style. Sorting makes that structural rather
// than a hand-maintained convention a later edit can silently break.
const PREPOSITIONS = [
  'in front of',
  'front of',
  'back of',
  'adjacent to',
  'near by',
  'nearby',
  'next to',
  'close to',
  'near',
  'opposite',
  'opp.',
  'opp',
  'behind',
  'beside',
  'adjacent',
  // Roman Urdu. Bare `saath` is deliberately absent: alone it is a noun
  // ("together"), and it would shadow any locality beginning with "Saath".
  'qareeb',
  'kareeb',
  'nazdeek',
  'k paas',
  'ke paas',
  'k pass',
  'ke pass',
  'k samne',
  'ke samne',
  'k saamne',
  'ke saamne',
  'k pichay',
  'ke pichay',
  'k peechay',
  'ke peechay',
  'k saath',
  'ke saath',
].sort((a, b) => b.length - a.length);

// Roman-Urdu and informal forms collapse onto the English term the package
// already emits, so a caller sees one vocabulary.
const CANON: Record<string, string> = {
  opp: 'opposite',
  'opp.': 'opposite',
  'near by': 'near',
  nearby: 'near',
  'close to': 'near',
  'next to': 'adjacent to',
  qareeb: 'near',
  kareeb: 'near',
  nazdeek: 'near',
  'k paas': 'near',
  'ke paas': 'near',
  'k pass': 'near',
  'ke pass': 'near',
  'k samne': 'opposite',
  'ke samne': 'opposite',
  'k saamne': 'opposite',
  'ke saamne': 'opposite',
  'k pichay': 'behind',
  'ke pichay': 'behind',
  'k peechay': 'behind',
  'ke peechay': 'behind',
  'k saath': 'adjacent to',
  'ke saath': 'adjacent to',
};

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
