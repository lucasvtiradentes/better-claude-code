import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distPath = join(__dirname, '../dist');
const distSrcFolder = join(distPath, 'src');
const distScriptsFolder = join(distPath, 'scripts');

console.log('Running backend postbuild...');

console.log('Step 1: Reorganizing dist folder...');
if (existsSync(distSrcFolder)) {
  const files = readdirSync(distSrcFolder);
  for (const file of files) {
    const srcFile = join(distSrcFolder, file);
    const destFile = join(distPath, file);
    const stat = statSync(srcFile);

    if (stat.isDirectory()) {
      if (!existsSync(destFile)) {
        mkdirSync(destFile, { recursive: true });
      }
      copyRecursive(srcFile, destFile);
    } else {
      copyFileSync(srcFile, destFile);
    }
  }
  rmSync(distSrcFolder, { recursive: true, force: true });
  console.log('✅ Moved dist/src/* to dist/');
}

if (existsSync(distScriptsFolder)) {
  rmSync(distScriptsFolder, { recursive: true, force: true });
  console.log('✅ Removed dist/scripts');
}

function copyRecursive(src: string, dest: string) {
  const files = readdirSync(src);
  for (const file of files) {
    const srcFile = join(src, file);
    const destFile = join(dest, file);
    const stat = statSync(srcFile);

    if (stat.isDirectory()) {
      if (!existsSync(destFile)) {
        mkdirSync(destFile, { recursive: true });
      }
      copyRecursive(srcFile, destFile);
    } else {
      copyFileSync(srcFile, destFile);
    }
  }
}

function replaceInFile(filePath: string) {
  let content = readFileSync(filePath, 'utf-8');

  content = content.replace(/from ['"]@better-claude-code\/shared['"]/g, "from '../shared/index.js'");
  content = content.replace(/from ['"]@better-claude-code\/node-utils['"]/g, "from '../node-utils/index.js'");

  writeFileSync(filePath, content, 'utf-8');
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

console.log('Step 2: Fixing imports in backend...');
processDirectory(distPath);
console.log('✅ Backend postbuild complete!');
