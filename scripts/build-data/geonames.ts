import {execFileSync} from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import {join} from 'node:path';
import type {Admin, Dump, RawPlace} from './types.js';

const BASE = 'https://download.geonames.org/export/dump/';
const DOWNLOADS = ['PK.zip', 'admin1CodesASCII.txt', 'admin2Codes.txt'];
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SEAT_COUNTRY = 'PK';

function isFresh(path: string): boolean {
  if (!existsSync(path)) return false;
  return Date.now() - statSync(path).mtimeMs < MAX_AGE_MS;
}

async function download(url: string, dest: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const bytes = Buffer.from(await res.arrayBuffer());
      if (bytes.length === 0) throw new Error('empty response body');
      const declared = res.headers.get('content-length');
      if (declared !== null && Number(declared) !== bytes.length) {
        throw new Error(
          `truncated download: received ${bytes.length} bytes but Content-Length is ${declared}`
        );
      }
      writeFileSync(dest, bytes);
      return;
    } catch (error) {
      lastError = error;
      console.warn(
        `  download attempt ${attempt}/3 failed for ${url}: ${String(error)}`
      );
    }
  }
  throw new Error(
    `Failed to download ${url} after 3 attempts: ${String(lastError)}`
  );
}

function requireUnzip(): void {
  try {
    execFileSync('unzip', ['-v'], {stdio: 'ignore'});
  } catch {
    throw new Error(
      'The system `unzip` binary is required to unpack PK.zip but was not found on PATH.'
    );
  }
}

function toNumber(value: string | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parsePlaces(txtPath: string): {places: RawPlace[]; dumpDate: string} {
  const places: RawPlace[] = [];
  let dumpDate = '';
  const lines = readFileSync(txtPath, 'utf8').split('\n');
  for (const line of lines) {
    if (line === '') continue;
    const c = line.split('\t');
    const featureClass = c[6] ?? '';
    if (featureClass !== 'P' && featureClass !== 'A') continue;
    const admin1Code = c[10] ?? '';
    const admin2Code = c[11] ?? '';
    places.push({
      name: c[1] ?? '',
      asciiname: c[2] ?? '',
      alt: (c[3] ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== ''),
      lat: toNumber(c[4]),
      lng: toNumber(c[5]),
      population: toNumber(c[14]),
      featureClass,
      featureCode: c[7] ?? '',
      admin1: admin1Code === '' ? '' : `${SEAT_COUNTRY}.${admin1Code}`,
      admin2:
        admin1Code === '' || admin2Code === ''
          ? ''
          : `${SEAT_COUNTRY}.${admin1Code}.${admin2Code}`,
    });
    const mod = c[18] ?? '';
    if (mod > dumpDate) dumpDate = mod;
  }
  return {places, dumpDate};
}

function parseAdmin(txtPath: string): Admin[] {
  const out: Admin[] = [];
  const lines = readFileSync(txtPath, 'utf8').split('\n');
  for (const line of lines) {
    if (line === '') continue;
    const c = line.split('\t');
    const code = c[0] ?? '';
    const name = c[1] ?? '';
    if (code === '') continue;
    out.push({code, name, asciiName: c[2] ?? ''});
  }
  return out;
}

export async function ensureDump(cacheDir: string): Promise<Dump> {
  mkdirSync(cacheDir, {recursive: true});

  for (const file of DOWNLOADS) {
    const dest = join(cacheDir, file);
    if (isFresh(dest)) {
      console.log(`  cache hit: ${file}`);
      continue;
    }
    console.log(`  downloading: ${file}`);
    await download(BASE + file, dest);
  }

  requireUnzip();
  execFileSync('unzip', ['-o', join(cacheDir, 'PK.zip'), '-d', cacheDir], {
    stdio: 'ignore',
  });

  const pkTxt = join(cacheDir, 'PK.txt');
  if (!existsSync(pkTxt)) {
    throw new Error(`Expected ${pkTxt} after unzip but it is missing.`);
  }

  const {places, dumpDate} = parsePlaces(pkTxt);
  const admin1 = parseAdmin(join(cacheDir, 'admin1CodesASCII.txt')).filter(
    (a) => a.code.startsWith(`${SEAT_COUNTRY}.`)
  );
  const admin2 = parseAdmin(join(cacheDir, 'admin2Codes.txt')).filter((a) =>
    a.code.startsWith(`${SEAT_COUNTRY}.`)
  );

  return {places, admin1, admin2, dumpDate};
}
