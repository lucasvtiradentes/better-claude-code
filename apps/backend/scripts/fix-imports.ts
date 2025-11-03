import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distPath = join(__dirname, '../dist');

const filesToFix = ['routes/projects.js', 'routes/sessions.js', 'routes/settings.js'];

console.log('Fixing imports in backend dist...');

for (const file of filesToFix) {
  const filePath = join(distPath, file);
  let content = readFileSync(filePath, 'utf-8');

  content = content.replace(/@better-claude-code\/shared/g, '../../shared/index.js');

  writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Fixed imports in ${file}`);
}

console.log('✅ All imports fixed');
