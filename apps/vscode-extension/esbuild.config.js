const esbuild = require('esbuild');
const path = require('path');
const postcss = require('postcss');
const tailwindcss = require('@tailwindcss/postcss');
const autoprefixer = require('autoprefixer');
const fs = require('fs');

const isWatch = process.argv.includes('--watch');

const extensionBuildOptions = {
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
};

const postcssPlugin = {
	name: 'postcss',
	setup(build) {
		build.onLoad({ filter: /\.css$/ }, async (args) => {
			const css = await fs.promises.readFile(args.path, 'utf8');
			const result = await postcss([
				tailwindcss,
				autoprefixer
			]).process(css, { from: args.path });

			return {
				contents: result.css,
				loader: 'css',
			};
		});
	},
};

const webviewBuildOptions = {
	entryPoints: ['src/webview/index.tsx'],
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
		'.css': 'css',
	},
	external: [],
	jsx: 'automatic',
};

async function build() {
	if (isWatch) {
		const extensionCtx = await esbuild.context(extensionBuildOptions);
		const webviewCtx = await esbuild.context(webviewBuildOptions);
		await Promise.all([
			extensionCtx.watch(),
			webviewCtx.watch()
		]);
		console.log('Watching for changes...');
	} else {
		await Promise.all([
			esbuild.build(extensionBuildOptions),
			esbuild.build(webviewBuildOptions)
		]);
		console.log('Build complete!');
	}
}

build().catch((err) => {
	console.error(err);
	process.exit(1);
});
