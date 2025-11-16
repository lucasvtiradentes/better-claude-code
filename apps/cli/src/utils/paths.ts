import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'url';

export function getPackageRoot(importMetaUrl: string) {
  const __filename = fileURLToPath(importMetaUrl);
  const __dirname = dirname(__filename);
  const isCompiledCode = __filename.endsWith('.js');

  if (isCompiledCode) {
    let current = dirname(__filename);
    while (!current.endsWith('/dist') && current !== '/') {
      current = resolve(current, '..');
    }
    return current.endsWith('/dist') ? resolve(current, '..') : dirname(__filename);
  }

  return resolve(__dirname, '../..');
}

export function getPackageJsonPath(importMetaUrl: string) {
  return join(getPackageRoot(importMetaUrl), 'package.json');
}

export function getDistPath(importMetaUrl: string, appName: string, ...pathSegments: string[]) {
  const __filename = fileURLToPath(importMetaUrl);
  const isCompiledCode = __filename.endsWith('.js');

  if (isCompiledCode) {
    let current = dirname(__filename);
    while (!current.endsWith('/dist') && current !== '/') {
      current = resolve(current, '..');
    }
    const distRoot = current.endsWith('/dist') ? current : dirname(__filename);
    return join(distRoot, 'apps', appName, ...pathSegments);
  }

  const repoRoot = resolve(dirname(__filename), '../../../..');
  return join(repoRoot, 'apps', appName, 'dist', ...pathSegments);
}
