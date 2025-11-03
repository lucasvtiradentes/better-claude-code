import path from 'path';
import { fileURLToPath } from 'url';

export function getPackageRoot(importMetaUrl: string): string {
  const __filename = fileURLToPath(importMetaUrl);
  const __dirname = path.dirname(__filename);
  const isCompiledCode = __filename.endsWith('.js');

  if (isCompiledCode) {
    return path.resolve(__dirname, '../../..');
  }

  return path.resolve(__dirname, '../..');
}

export function getPackageJsonPath(importMetaUrl: string): string {
  return path.join(getPackageRoot(importMetaUrl), 'package.json');
}

export function getDistPath(importMetaUrl: string, ...segments: string[]): string {
  const __filename = fileURLToPath(importMetaUrl);
  const __dirname = path.dirname(__filename);
  const isCompiledCode = __filename.endsWith('.js');

  if (isCompiledCode) {
    const distRoot = path.resolve(__dirname, '../../..');
    return path.join(distRoot, ...segments);
  }

  const repoRoot = path.resolve(__dirname, '../../../..');
  return path.join(repoRoot, 'apps', ...segments);
}
