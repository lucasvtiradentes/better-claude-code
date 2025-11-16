import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

class PostBuild {
  private readonly cliRoot: string;
  private readonly repoRoot: string;
  private readonly cliDistRoot: string;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    this.cliRoot = resolve(__dirname, '..');
    this.repoRoot = resolve(this.cliRoot, '../..');
    this.cliDistRoot = join(this.cliRoot, 'dist');
  }

  async execute() {
    console.log('Running postbuild script...');
    this.copyBackendAndFrontend();
    this.copySharedPackages();
    this.fixBackendImports();
    this.copySharedPackagesToRoot();
    this.fixCliImports();
    this.copyCliAssets();
    console.log('✅ Postbuild complete!');
  }

  private copyRecursive(src: string, dest: string) {
    const exists = existsSync(src);
    const stats = exists && statSync(src);
    const isDirectory = exists && stats && stats.isDirectory();

    if (isDirectory) {
      if (!existsSync(dest)) {
        mkdirSync(dest, { recursive: true });
      }
      readdirSync(src).forEach((childItemName) => {
        this.copyRecursive(join(src, childItemName), join(dest, childItemName));
      });
    } else {
      copyFileSync(src, dest);
    }
  }

  private copyIfExists(src: string, dest: string, logMessage: string) {
    if (existsSync(src)) {
      if (existsSync(dest)) {
        rmSync(dest, { recursive: true, force: true });
      }
      this.copyRecursive(src, dest);
      console.log(`✅ ${logMessage}`);
      return true;
    }
    return false;
  }

  private copyBackendAndFrontend() {
    console.log('Step 1: Copying backend and frontend to apps/...');

    this.copyIfExists(
      join(this.repoRoot, 'apps/backend/dist'),
      join(this.cliDistRoot, 'apps/backend'),
      'Backend copied to apps/backend'
    );

    this.copyIfExists(
      join(this.repoRoot, 'apps/frontend/dist'),
      join(this.cliDistRoot, 'apps/frontend'),
      'Frontend copied to apps/frontend'
    );
  }

  private copySharedPackages() {
    console.log('Step 2: Copying shared packages...');

    const backendDest = join(this.cliDistRoot, 'apps/backend');

    this.copyIfExists(
      join(this.repoRoot, 'packages/node-utils/dist'),
      join(backendDest, 'packages/node-utils'),
      'Copied node-utils to apps/backend/packages'
    );

    this.copyIfExists(
      join(this.repoRoot, 'packages/shared/dist'),
      join(backendDest, 'packages/shared'),
      'Copied shared to apps/backend/packages'
    );
  }

  private fixBackendImports() {
    console.log('Step 3: Fixing backend imports...');

    const backendDest = join(this.cliDistRoot, 'apps/backend');
    if (existsSync(backendDest)) {
      this.fixImportsInDir(backendDest, backendDest);
      console.log('✅ Fixed backend imports');
    }
  }

  private fixImportsInDir(dir: string, backendRoot: string) {
    const files = readdirSync(dir);
    for (const file of files) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        this.fixImportsInDir(fullPath, backendRoot);
      } else if (file.endsWith('.js')) {
        this.fixFileImports(fullPath, backendRoot);
      }
    }
  }

  private fixFileImports(filePath: string, backendRoot: string) {
    let content = readFileSync(filePath, 'utf-8');
    const needsFix = content.includes('node-utils/index.js') || content.includes('shared/index.js');

    if (!needsFix) return;

    const relToBackend = relative(dirname(filePath), backendRoot);
    const nodeUtilsPath = this.normalizeImportPath(join(relToBackend, 'packages/node-utils/index.js'));
    const sharedPath = this.normalizeImportPath(join(relToBackend, 'packages/shared/index.js'));

    content = content
      .replace(/from ['"]node-utils\/index\.js['"]/g, `from '${nodeUtilsPath}'`)
      .replace(/from ['"]shared\/index\.js['"]/g, `from '${sharedPath}'`)
      .replace(/from ['"]\.\.\/\.\.\/node-utils\/index\.js['"]/g, `from '${nodeUtilsPath}'`)
      .replace(/from ['"]\.\.\/node-utils\/index\.js['"]/g, `from '${nodeUtilsPath}'`)
      .replace(/from ['"]\.\.\/\.\.\/shared\/index\.js['"]/g, `from '${sharedPath}'`)
      .replace(/from ['"]\.\.\/shared\/index\.js['"]/g, `from '${sharedPath}'`);

    writeFileSync(filePath, content, 'utf-8');
  }

  private normalizeImportPath(path: string): string {
    const normalized = path.replace(/\\/g, '/');
    return normalized.startsWith('.') ? normalized : `./${normalized}`;
  }

  private copySharedPackagesToRoot() {
    console.log('Step 4: Copying shared packages to root dist...');

    this.copyIfExists(
      join(this.repoRoot, 'packages/node-utils/dist'),
      join(this.cliDistRoot, 'packages/node-utils'),
      'Copied node-utils to dist/packages'
    );

    this.copyIfExists(
      join(this.repoRoot, 'packages/shared/dist'),
      join(this.cliDistRoot, 'packages/shared'),
      'Copied shared to dist/packages'
    );
  }

  private fixCliImports() {
    console.log('Step 5: Fixing CLI imports...');

    const cliDest = join(this.cliDistRoot, 'apps/cli');
    if (existsSync(cliDest)) {
      this.fixCliImportsInDir(cliDest);
      console.log('✅ Fixed CLI imports');
    }
  }

  private fixCliImportsInDir(dir: string) {
    const files = readdirSync(dir);
    for (const file of files) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        this.fixCliImportsInDir(fullPath);
      } else if (file.endsWith('.js')) {
        this.fixCliFileImports(fullPath);
      }
    }
  }

  private fixCliFileImports(filePath: string) {
    let content = readFileSync(filePath, 'utf-8');
    const hasInternalImports = content.includes('@better-claude-code/');

    if (!hasInternalImports) return;

    const relToDistRoot = relative(dirname(filePath), this.cliDistRoot);
    const nodeUtilsPath = this.normalizeImportPath(join(relToDistRoot, 'packages/node-utils/index.js'));
    const sharedPath = this.normalizeImportPath(join(relToDistRoot, 'packages/shared/index.js'));

    content = content
      .replace(/from ['"]@better-claude-code\/node-utils['"]/g, `from '${nodeUtilsPath}'`)
      .replace(/from ['"]@better-claude-code\/shared['"]/g, `from '${sharedPath}'`);

    writeFileSync(filePath, content, 'utf-8');
  }

  private copyCliAssets() {
    console.log('Step 6: Copying CLI assets...');

    const cliDistDest = join(this.cliDistRoot, 'apps/cli');

    this.copyIfExists(
      join(this.cliRoot, 'src/prompts'),
      join(cliDistDest, 'prompts'),
      'Prompts copied to apps/cli/prompts'
    );

    this.copyIfExists(
      join(this.cliRoot, 'package.json'),
      join(cliDistDest, 'package.json'),
      'package.json copied to apps/cli'
    );
  }
}

const postBuild = new PostBuild();
postBuild.execute().catch((err) => {
  throw new Error(err);
});
