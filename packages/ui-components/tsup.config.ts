import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import { readFile, writeFile } from 'fs/promises';
import postcss from 'postcss';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts'
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";'
    };
  },
  async onSuccess() {
    const cssInput = await readFile('src/styles/globals.css', 'utf-8');
    const result = await postcss([tailwindcss, autoprefixer]).process(cssInput, {
      from: 'src/styles/globals.css',
      to: 'dist/styles.css'
    });

    await writeFile('dist/styles.css', result.css);
    if (result.map) {
      await writeFile('dist/styles.css.map', result.map.toString());
    }
  }
});
