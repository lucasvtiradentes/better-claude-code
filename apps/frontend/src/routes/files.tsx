import { createFileRoute } from '@tanstack/react-router';
import { Layout } from '../components/layout/Layout';
import { FileEditor } from '../features/files/pages/FileEditor';

export const Route = createFileRoute('/files')({
  component: FilesRoute
});

function FilesRoute() {
  return (
    <Layout>
      <FileEditor />
    </Layout>
  );
}
