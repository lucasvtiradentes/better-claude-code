import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: '../backend/swagger.json',
    output: {
      mode: 'tags-split',
      target: './src/api/_generated/generated.ts',
      schemas: './src/api/_generated/schemas',
      client: 'react-query',
      override: {
        mutator: {
          path: './src/api/custom-instance.ts',
          name: 'customInstance'
        }
      }
    }
  }
});
