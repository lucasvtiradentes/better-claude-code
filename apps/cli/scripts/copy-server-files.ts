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

const cliDistSrc = path.join(cliRoot, 'dist');
const backendDistSrc = path.join(repoRoot, 'apps/backend/dist');
const frontendDistSrc = path.join(repoRoot, 'apps/frontend/dist');
const sharedDistSrc = path.join(repoRoot, 'packages/shared/dist');

const rootDistDest = path.join(repoRoot, 'dist');
const cliDistDest = path.join(rootDistDest, 'cli');
const backendDistDest = path.join(rootDistDest, 'backend');
const frontendDistDest = path.join(rootDistDest, 'frontend');
const sharedDistDest = path.join(rootDistDest, 'shared');

console.log('Copying files to root dist for production...');

if (!fs.existsSync(rootDistDest)) {
  fs.mkdirSync(rootDistDest, { recursive: true });
}

const prodPackageJson = {
  name: 'better-claude-code',
  version: '0.0.1',
  type: 'module',
  private: true,
  bin: {
    bcc: './cli/cli.js'
  },
  files: ['cli', 'backend', 'frontend', 'shared']
};

fs.writeFileSync(path.join(rootDistDest, 'package.json'), JSON.stringify(prodPackageJson, null, 2));
console.log('✅ package.json created');

if (fs.existsSync(cliDistSrc)) {
  console.log(`Copying CLI from ${cliDistSrc} to ${cliDistDest}`);
  copyRecursive(cliDistSrc, cliDistDest);
  console.log('✅ CLI copied');
} else {
  console.warn(`⚠️  CLI dist not found at ${cliDistSrc}`);
}

if (fs.existsSync(backendDistSrc)) {
  console.log(`Copying backend from ${backendDistSrc} to ${backendDistDest}`);
  copyRecursive(backendDistSrc, backendDistDest);
  console.log('✅ Backend copied');
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

  const nodeModulesPath = path.join(rootDistDest, 'node_modules/@better-claude-code');
  const sharedNodeModulePath = path.join(nodeModulesPath, 'shared');

  if (!fs.existsSync(sharedNodeModulePath)) {
    fs.mkdirSync(sharedNodeModulePath, { recursive: true });
  }

  copyRecursive(sharedDistSrc, sharedNodeModulePath);

  const sharedPackageJson = {
    name: '@better-claude-code/shared',
    version: '0.0.1',
    type: 'module',
    main: './index.cjs',
    module: './index.js',
    types: './index.d.ts',
    exports: {
      '.': {
        types: './index.d.ts',
        import: './index.js',
        require: './index.cjs'
      }
    }
  };

  fs.writeFileSync(path.join(sharedNodeModulePath, 'package.json'), JSON.stringify(sharedPackageJson, null, 2));
  console.log('✅ Shared package.json created in node_modules');
} else {
  console.warn(`⚠️  Shared dist not found at ${sharedDistSrc}`);
}

console.log('✅ All files copied to root dist');
