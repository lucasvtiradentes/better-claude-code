import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { BACKEND_PORT } from '@better-claude-code/shared';
import { fileURLToPath } from 'url';
import { createServer, getSwaggerConfig } from '../src/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendPath = join(__dirname, '..');

console.log('Generating swagger.json...');

const app = createServer({ port: BACKEND_PORT });
const openapiSpec = app.getOpenAPI31Document(getSwaggerConfig(BACKEND_PORT));
const swaggerPath = join(backendPath, 'swagger.json');
writeFileSync(swaggerPath, JSON.stringify(openapiSpec, null, 2), 'utf-8');
console.log(`✅ Generated swagger.json at ${swaggerPath}`);
