import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'url';

export function getPackageRoot(importMetaUrl: string): string {
  const __filename = fileURLToPath(importMetaUrl);
  const __dirname = dirname(__filename);
  const isCompiledCode = __filename.endsWith('.js');

  if (isCompiledCode) {
    return resolve(__dirname, '../../..');
  }

  return resolve(__dirname, '../..');
}

export function getPackageJsonPath(importMetaUrl: string): string {
  return join(getPackageRoot(importMetaUrl), 'package.json');
}

export function getDistPath(importMetaUrl: string, appName: string, ...pathSegments: string[]): string {
  const __filename = fileURLToPath(importMetaUrl);
  const __dirname = dirname(__filename);
  const isCompiledCode = __filename.endsWith('.js');

  if (isCompiledCode) {
    const packageRoot = resolve(__dirname, '../../..');
    return join(packageRoot, 'dist', appName, ...pathSegments);
  }

  const repoRoot = resolve(__dirname, '../../../..');
  return join(repoRoot, 'apps', appName, 'dist', ...pathSegments);
}
