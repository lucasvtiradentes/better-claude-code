import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copyRecursive(src: string, dest: string): void {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

const cliRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(cliRoot, '../..');

const backendDistSrc = path.join(repoRoot, 'apps/backend/dist');
const frontendDistSrc = path.join(repoRoot, 'apps/frontend/dist');
const sharedDistSrc = path.join(repoRoot, 'packages/shared/dist');

const cliDistRoot = path.join(cliRoot, 'dist');
const backendDistDest = path.join(cliDistRoot, 'backend');
const frontendDistDest = path.join(cliDistRoot, 'frontend');
const sharedDistDest = path.join(cliDistRoot, 'shared');

console.log('Copying server files to CLI dist for production...');

if (!fs.existsSync(cliDistRoot)) {
  fs.mkdirSync(cliDistRoot, { recursive: true });
}

if (fs.existsSync(backendDistSrc)) {
  console.log(`Copying backend from ${backendDistSrc} to ${backendDistDest}`);
  copyRecursive(backendDistSrc, backendDistDest);
  console.log('✅ Backend copied');

  console.log('Fixing backend imports...');
  function fixImportsInDirectory(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        fixImportsInDirectory(fullPath);
      } else if (file.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const relativePath = path.relative(path.dirname(fullPath), sharedDistDest);
        const importPath = relativePath.replace(/\\/g, '/') + '/index.js';
        const updated = content.replace(
          /from ['"]@better-claude-code\/shared['"]/g,
          `from '${importPath}'`
        );
        if (content !== updated) {
          fs.writeFileSync(fullPath, updated, 'utf-8');
        }
      }
    }
  }
  fixImportsInDirectory(backendDistDest);
  console.log('✅ Backend imports fixed');
} else {
  console.warn(`⚠️  Backend dist not found at ${backendDistSrc}`);
}

if (fs.existsSync(frontendDistSrc)) {
  console.log(`Copying frontend from ${frontendDistSrc} to ${frontendDistDest}`);
  copyRecursive(frontendDistSrc, frontendDistDest);
  console.log('✅ Frontend copied');
} else {
  console.warn(`⚠️  Frontend dist not found at ${frontendDistSrc}`);
}

if (fs.existsSync(sharedDistSrc)) {
  console.log(`Copying shared from ${sharedDistSrc} to ${sharedDistDest}`);
  copyRecursive(sharedDistSrc, sharedDistDest);
  console.log('✅ Shared copied');
} else {
  console.warn(`⚠️  Shared dist not found at ${sharedDistSrc}`);
}

console.log('✅ All server files copied to CLI dist');
