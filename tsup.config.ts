import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  external: [
    '@angular/common',
    '@angular/core', 
    '@ngrx/signals',
    'primeng/api',
    'primeng/table',
    'rxjs',
    'zod'
  ],
});
