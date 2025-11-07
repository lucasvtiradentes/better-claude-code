import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'url';
import { createServer, getSwaggerConfig } from '../src/common/server';
import { ENV } from '../src/env';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const backendPath = join(__dirname, '..');

console.log('Generating swagger.json...');

const app = createServer(ENV.SERVER_PORT);
const openapiSpec = app.getOpenAPI31Document(getSwaggerConfig(ENV.SERVER_PORT));

const swaggerPath = join(backendPath, '_generated', 'swagger.json');
writeFileSync(swaggerPath, JSON.stringify(openapiSpec, null, 2), 'utf-8');
console.log(`✅ Generated swagger.json at ${swaggerPath}`);
