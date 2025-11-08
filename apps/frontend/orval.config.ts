import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: '../backend/_generated/swagger.json',
    output: {
      mode: 'tags-split',
      target: './src/api/_generated/generated.ts',
      schemas: './src/api/_generated/schemas',
      client: 'react-query',
      override: {
        // enumGenerationType: 'enum',
        mutator: {
          path: './src/api/custom-instance.ts',
          name: 'customInstance'
        }
      }
    }
  }
});
