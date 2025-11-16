import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { VSCODE_EXTENSIONS_DIR } from '@better-claude-code/node-utils';

interface PackageJson {
  publisher: string;
  name: string;
  version: string;
}

const packageJson: PackageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const extensionName = `${packageJson.publisher}.${packageJson.name}-${packageJson.version}`;
const targetDir = join(VSCODE_EXTENSIONS_DIR, extensionName);

if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true });
}

mkdirSync(targetDir, { recursive: true });

function copyRecursive(src: string, dest: string): void {
  const stat = statSync(src);

  if (stat.isDirectory()) {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }

    const entries = readdirSync(src);
    for (const entry of entries) {
      copyRecursive(join(src, entry), join(dest, entry));
    }
  } else {
    copyFileSync(src, dest);
  }
}

copyRecursive('out', join(targetDir, 'out'));
copyRecursive('resources', join(targetDir, 'resources'));
copyFileSync('package.json', join(targetDir, 'package.json'));

if (existsSync('README.md')) {
  copyFileSync('README.md', join(targetDir, 'README.md'));
}

console.log(`\n✅ Extension installed to: ${targetDir}`);
console.log(`\n🔄 Reload VSCode to activate the extension:`);
console.log(`   - Press Ctrl+Shift+P`);
console.log(`   - Type "Reload Window" and press Enter\n`);
