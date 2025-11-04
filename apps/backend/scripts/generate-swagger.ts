import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Generating swagger.json...');

const backendPath = join(__dirname, '..');
// @ts-expect-error
const { createServer } = await import('../dist/server.js');
const app = createServer({ port: 3001 });
const openapiSpec = app.getOpenAPI31Document({
  openapi: '3.1.0',
  info: {
    version: '1.0.0',
    title: 'Better Claude Code API',
    description: 'API for managing Claude projects, sessions, and settings'
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Local development server'
    }
  ]
});
const swaggerPath = join(backendPath, 'swagger.json');
writeFileSync(swaggerPath, JSON.stringify(openapiSpec, null, 2), 'utf-8');
console.log(`✅ Generated swagger.json at ${swaggerPath}`);
