import { readFile } from 'node:fs/promises';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import esbuild, { type BuildOptions, type Plugin } from 'esbuild';
import postcss from 'postcss';

const isWatch = process.argv.includes('--watch');
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
  sourcemap: isWatch,
  minify: !isWatch,
  logLevel: 'info',
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp)
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
  entryPoints: ['src/session-view-page/webview/index.tsx'],
  bundle: true,
  outfile: 'out/webview/index.js',
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  sourcemap: isWatch,
  minify: !isWatch,
  logLevel: 'info',
  plugins: [postcssPlugin],
  loader: {
    '.css': 'css'
  },
  external: [],
  jsx: 'automatic'
};

async function build() {
  if (isWatch) {
    const extensionCtx = await esbuild.context(extensionBuildOptions);
    const webviewCtx = await esbuild.context(webviewBuildOptions);
    await Promise.all([extensionCtx.watch(), webviewCtx.watch()]);
    console.log('Watching for changes...');
  } else {
    await Promise.all([esbuild.build(extensionBuildOptions), esbuild.build(webviewBuildOptions)]);
    console.log('Build complete!');
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
