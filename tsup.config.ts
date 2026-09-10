import {defineConfig} from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  treeshake: true,
  sourcemap: false,
  outExtension: ({format}) => ({js: format === 'cjs' ? '.cjs' : '.js'}),
});
