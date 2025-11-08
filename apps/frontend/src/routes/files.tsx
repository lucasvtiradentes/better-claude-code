import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { FilesPage } from '../features/files/pages/files.page';

const filesSearchSchema = z.object({
  path: z.string().optional()
});

export const Route = createFileRoute('/files')({
  component: FilesPage,
  validateSearch: filesSearchSchema
});
