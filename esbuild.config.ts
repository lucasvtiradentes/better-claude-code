import { readFile } from 'node:fs/promises';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import esbuild, { type BuildOptions, type Plugin } from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import postcss from 'postcss';
import { typescript } from 'svelte-preprocess';

const logger = console;
const isDev = !process.env.CI;
const buildDate = new Date();
const utcMinus3 = new Date(buildDate.getTime() - 3 * 60 * 60 * 1000);
const buildTimestamp = utcMinus3.toISOString().replace('Z', '-03:00');

const extensionBuildOptions: BuildOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'out/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: false,
  minify: false,
  logLevel: 'info',
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp),
    __IS_DEV_BUILD__: JSON.stringify(isDev)
  }
};

const postcssPlugin: Plugin = {
  name: 'postcss',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const css = await readFile(args.path, 'utf8');
      const result = await postcss([tailwindcss, autoprefixer]).process(css, { from: args.path });

      return {
        contents: result.css,
        loader: 'css'
      };
    });
  }
};

const webviewBuildOptions: BuildOptions = {
  entryPoints: ['src/session-view-page/webview/main.ts'],
  bundle: true,
  outfile: 'out/webview/index.js',
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  sourcemap: false,
  minify: false,
  logLevel: 'info',
  plugins: [
    sveltePlugin({
      preprocess: [typescript()],
      compilerOptions: {
        css: 'injected'
      }
    }),
    postcssPlugin
  ],
  conditions: ['svelte', 'browser'],
  mainFields: ['svelte', 'browser', 'module', 'main']
};

async function build() {
  await Promise.all([esbuild.build(extensionBuildOptions), esbuild.build(webviewBuildOptions)]);
  logger.log('Build complete!');
}

build().catch((err) => {
  logger.error(err);
  process.exit(1);
});
