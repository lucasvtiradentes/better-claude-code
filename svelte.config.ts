import { typescript } from 'svelte-preprocess';

export default {
  preprocess: [typescript({ tsconfigFile: './tsconfig.webview.json' })]
};
