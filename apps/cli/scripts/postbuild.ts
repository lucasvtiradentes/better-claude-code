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
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function copyRecursive(src: string, dest: string): void {
  const exists = existsSync(src);
  const stats = exists && statSync(src);
  const isDirectory = exists && stats && stats.isDirectory();

  if (isDirectory) {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }
    readdirSync(src).forEach((childItemName) => {
      copyRecursive(join(src, childItemName), join(dest, childItemName));
    });
  } else {
    copyFileSync(src, dest);
  }
}

const cliRoot = resolve(__dirname, '..');
const repoRoot = resolve(cliRoot, '../..');

const cliDistRoot = join(cliRoot, 'dist');
const cliDistSrcFolder = join(cliDistRoot, 'src');
const cliDistScriptsFolder = join(cliDistRoot, 'scripts');

console.log('Running postbuild script...');

console.log('Step 1: Reorganizing dist folder...');
if (existsSync(cliDistSrcFolder)) {
  const tempFolder = join(cliDistRoot, 'temp_cli');
  copyRecursive(cliDistSrcFolder, tempFolder);
  rmSync(cliDistSrcFolder, { recursive: true, force: true });

  const cliFolder = join(cliDistRoot, 'cli');
  if (existsSync(tempFolder)) {
    copyRecursive(tempFolder, cliFolder);
    rmSync(tempFolder, { recursive: true, force: true });
  }
  console.log('✅ Moved dist/src to dist/cli');
}

if (existsSync(cliDistScriptsFolder)) {
  rmSync(cliDistScriptsFolder, { recursive: true, force: true });
  console.log('✅ Removed dist/scripts');
}

const backendDistSrc = join(repoRoot, 'apps/backend/dist');
const frontendDistSrc = join(repoRoot, 'apps/frontend/dist');
const sharedDistSrc = join(repoRoot, 'packages/shared/dist');

const backendDistDest = join(cliDistRoot, 'backend');
const frontendDistDest = join(cliDistRoot, 'frontend');
const sharedDistDest = join(cliDistRoot, 'shared');

console.log('Step 2: Copying server files to CLI dist...');

if (!existsSync(cliDistRoot)) {
  mkdirSync(cliDistRoot, { recursive: true });
}

function fixImportsInDirectory(dir: string) {
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      fixImportsInDirectory(fullPath);
    } else if (file.endsWith('.js')) {
      const content = readFileSync(fullPath, 'utf-8');
      const relativePath = relative(dirname(fullPath), sharedDistDest);
      const importPath = `${relativePath.replace(/\\/g, '/')}/index.js`;
      const updated = content.replace(/from ['"]@better-claude-code\/shared['"]/g, `from '${importPath}'`);
      if (content !== updated) {
        writeFileSync(fullPath, updated, 'utf-8');
      }
    }
  }
}

if (existsSync(backendDistSrc)) {
  console.log(`Copying backend from ${backendDistSrc} to ${backendDistDest}`);
  copyRecursive(backendDistSrc, backendDistDest);
  console.log('✅ Backend copied');

  console.log('Fixing backend imports...');
  fixImportsInDirectory(backendDistDest);
  console.log('✅ Backend imports fixed');
} else {
  console.warn(`⚠️  Backend dist not found at ${backendDistSrc}`);
}

if (existsSync(frontendDistSrc)) {
  console.log(`Copying frontend from ${frontendDistSrc} to ${frontendDistDest}`);
  copyRecursive(frontendDistSrc, frontendDistDest);
  console.log('✅ Frontend copied');
} else {
  console.warn(`⚠️  Frontend dist not found at ${frontendDistSrc}`);
}

if (existsSync(sharedDistSrc)) {
  console.log(`Copying shared from ${sharedDistSrc} to ${sharedDistDest}`);
  copyRecursive(sharedDistSrc, sharedDistDest);
  console.log('✅ Shared copied');
} else {
  console.warn(`⚠️  Shared dist not found at ${sharedDistSrc}`);
}

const promptsSrc = join(cliRoot, 'src/prompts');
const promptsDest = join(cliDistRoot, 'cli/prompts');

if (existsSync(promptsSrc)) {
  console.log(`Copying prompts from ${promptsSrc} to ${promptsDest}`);
  copyRecursive(promptsSrc, promptsDest);
  console.log('✅ Prompts copied');
} else {
  console.warn(`⚠️  Prompts folder not found at ${promptsSrc}`);
}

console.log('Fixing CLI imports...');
const cliDistCliFolder = join(cliDistRoot, 'cli');
if (existsSync(cliDistCliFolder)) {
  fixImportsInDirectory(cliDistCliFolder);
  console.log('✅ CLI imports fixed');
}

console.log('✅ Postbuild complete!');
