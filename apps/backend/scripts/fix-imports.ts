import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distPath = join(__dirname, '../dist');

function replaceInFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8');
  const updated = content.replace(/from ['"]@better-claude-code\/shared['"]/g, "from '../shared/index.js'");

  if (content !== updated) {
    writeFileSync(filePath, updated, 'utf-8');
    console.log(`✅ Fixed imports in ${filePath}`);
  }
}

function processDirectory(dir: string) {
  const files = readdirSync(dir);

  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.js')) {
      replaceInFile(fullPath);
    }
  }
}

console.log('Fixing imports in backend...');
processDirectory(distPath);
console.log('✅ All imports fixed');
