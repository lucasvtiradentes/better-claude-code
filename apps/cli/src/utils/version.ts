import { readFileSync } from 'node:fs';
import { getPackageJsonPath } from './paths.js';

const packageJsonPath = getPackageJsonPath(import.meta.url);
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

export const APP_VERSION = packageJson.version;
