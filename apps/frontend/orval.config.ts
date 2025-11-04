import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: '../backend/swagger.json',
    output: {
      mode: 'tags-split',
      target: './src/api_hooks/generated.ts',
      schemas: './src/api_hooks/schemas',
      client: 'react-query',
      override: {
        mutator: {
          path: './src/api_hooks/custom-instance.ts',
          name: 'customInstance'
        }
      }
    }
  }
});
