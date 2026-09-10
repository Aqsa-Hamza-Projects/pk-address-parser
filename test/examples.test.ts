import {describe, it, expect, beforeAll} from 'vitest';
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const run = (cmd: string, args: string[]) =>
  execFileSync(cmd, args, {cwd: root, stdio: 'pipe'}).toString();

describe('examples', () => {
  beforeAll(() => {
    if (!existsSync(new URL('../dist/index.js', import.meta.url))) {
      execFileSync('npm', ['run', 'build'], {cwd: root, stdio: 'pipe'});
    }
  }, 120_000);

  it.each([
    'examples/01-parse-address.ts',
    'examples/02-normalize-address.ts',
    'examples/03-geo-helpers.ts',
    'examples/04-batch-cleanup.ts',
  ])('%s runs and exits 0 (TypeScript via tsx)', (file) => {
    expect(() => run('npx', ['tsx', file])).not.toThrow();
  });

  it('05-commonjs.cjs runs and exits 0 (plain-JS CommonJS require)', () => {
    expect(() => run('node', ['examples/05-commonjs.cjs'])).not.toThrow();
  });

  it('06-esm.mjs runs and exits 0 (plain-JS ESM import)', () => {
    expect(() => run('node', ['examples/06-esm.mjs'])).not.toThrow();
  });
});
