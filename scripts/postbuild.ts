import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROMPTS_FOLDER_FOR_EXTENSION } from '@/lib/node-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PostBuild {
  private readonly extensionRoot: string;
  private readonly outDir: string;

  constructor() {
    this.extensionRoot = join(__dirname, '..');
    this.outDir = join(this.extensionRoot, 'out');
  }

  execute() {
    console.log('Running vscode-extension postbuild...');
    this.copyPrompts();
    console.log('✅ Postbuild complete!');
  }

  private copyPrompts() {
    console.log('Copying prompts folder...');

    const promptsSource = PROMPTS_FOLDER_FOR_EXTENSION;
    const promptsDest = join(this.outDir, 'prompts');

    if (!existsSync(promptsSource)) {
      console.warn('⚠️  Prompts folder not found at:', promptsSource);
      return;
    }

    if (!existsSync(promptsDest)) {
      mkdirSync(promptsDest, { recursive: true });
    }

    const files = ['session-compaction.prompt.md'];
    for (const file of files) {
      const src = join(promptsSource, file);
      const dest = join(promptsDest, file);
      if (existsSync(src)) {
        copyFileSync(src, dest);
        console.log(`✅ Copied ${file}`);
      }
    }
  }
}

const postBuild = new PostBuild();
postBuild.execute();
