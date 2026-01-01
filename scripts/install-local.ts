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
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  addDevLabel,
  addDevSuffixStatic as addDevSuffix,
  CONTEXT_PREFIX,
  DEV_SUFFIX,
  EXTENSION_DISPLAY_NAME,
  EXTENSION_NAME
} from '@/lib/shared/scripts-constants';

const LOCAL_DIST_DIR = 'dist-dev';
const VSCODE_STANDARD_CONTAINERS = ['explorer', 'scm', 'debug', 'test', 'remote'];

const EDITOR_EXTENSIONS_PATHS = {
  vscode: '.vscode/extensions',
  cursor: '.cursor/extensions',
  windsurf: '.windsurf/extensions',
  vscodium: {
    darwin: '.vscode-oss/extensions',
    linux: '.config/VSCodium/extensions'
  }
} as const;

enum Editor {
  VSCode = 'vscode',
  Cursor = 'cursor',
  VSCodium = 'vscodium',
  Windsurf = 'windsurf'
}

const EDITOR_DISPLAY_NAMES: Record<Editor, string> = {
  [Editor.VSCode]: 'VSCode',
  [Editor.Cursor]: 'Cursor',
  [Editor.VSCodium]: 'VSCodium',
  [Editor.Windsurf]: 'Windsurf'
};

type ExtensionEntry = {
  identifier?: { id: string };
  version?: string;
  location?: { $mid: number; path: string; scheme: string };
  relativeLocation?: string;
};

const logger = console;
const ROOT_DIR = process.cwd();
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const EXTENSION_ID_DEV = `${packageJson.publisher}.${packageJson.name}-dev`;

function main() {
  if (process.env.CI) {
    logger.log('Skipping local extension installation in CI environment');
    process.exit(0);
  }

  setupLocalDistDirectory();
  copyExtensionFiles();
  writePackageJson();
  copyMetaFiles();
  copyToEditorExtensions();
  registerExtensionInEditors();
  printSuccessMessage();
}

function getLocalDistDirectory(): string {
  return join(ROOT_DIR, LOCAL_DIST_DIR);
}

function setupLocalDistDirectory() {
  const targetDir = getLocalDistDirectory();
  if (existsSync(targetDir)) {
    rmSync(targetDir, { recursive: true });
  }
  mkdirSync(targetDir, { recursive: true });
}

function copyRecursive(src: string, dest: string): void {
  const stat = statSync(src);

  if (stat.isDirectory()) {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }

    const entries = readdirSync(src);
    for (const entry of entries) {
      copyRecursive(join(src, entry), join(dest, entry));
    }
  } else {
    copyFileSync(src, dest);
  }
}

function copyExtensionFiles() {
  const targetDir = getLocalDistDirectory();
  copyRecursive(join(ROOT_DIR, 'out'), join(targetDir, 'out'));
  copyRecursive(join(ROOT_DIR, 'resources'), join(targetDir, 'resources'));
}

function writePackageJson() {
  const targetDir = getLocalDistDirectory();
  const modifiedPackageJson = applyDevTransformations(packageJson);
  writeFileSync(join(targetDir, 'package.json'), JSON.stringify(modifiedPackageJson, null, '\t'));
}

function copyMetaFiles() {
  const targetDir = getLocalDistDirectory();

  if (existsSync('LICENSE')) {
    copyFileSync('LICENSE', join(targetDir, 'LICENSE'));
  }

  if (existsSync('README.md')) {
    copyFileSync('README.md', join(targetDir, 'README.md'));
  }
}

function getEditorExtensionsPath(editor: Editor): string {
  const paths: Record<Editor, string> = {
    [Editor.VSCode]: join(homedir(), EDITOR_EXTENSIONS_PATHS.vscode),
    [Editor.Cursor]: join(homedir(), EDITOR_EXTENSIONS_PATHS.cursor),
    [Editor.Windsurf]: join(homedir(), EDITOR_EXTENSIONS_PATHS.windsurf),
    [Editor.VSCodium]:
      process.platform === 'darwin'
        ? join(homedir(), EDITOR_EXTENSIONS_PATHS.vscodium.darwin)
        : join(homedir(), EDITOR_EXTENSIONS_PATHS.vscodium.linux)
  };
  return paths[editor];
}

function copyToEditorExtensions() {
  const sourceDir = getLocalDistDirectory();
  const installedEditors: string[] = [];

  for (const editor of Object.values(Editor)) {
    const extensionsPath = getEditorExtensionsPath(editor);
    if (!existsSync(extensionsPath)) continue;

    const targetDir = join(extensionsPath, EXTENSION_ID_DEV);
    if (existsSync(targetDir)) {
      rmSync(targetDir, { recursive: true });
    }
    mkdirSync(targetDir, { recursive: true });
    copyRecursive(sourceDir, targetDir);
    installedEditors.push(EDITOR_DISPLAY_NAMES[editor]);
  }

  if (installedEditors.length === 0) {
    logger.log('⚠️  No editors found');
  } else {
    logger.log(`✅ Installed to: ${installedEditors.join(', ')}`);
  }
}

function registerExtensionInEditors() {
  const targetDir = getLocalDistDirectory();
  const pkgJsonPath = join(targetDir, 'package.json');
  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
  const version = pkgJson.version as string;

  for (const editor of Object.values(Editor)) {
    const extensionsPath = getEditorExtensionsPath(editor);
    if (!existsSync(extensionsPath)) continue;

    const extensionsJsonPath = join(extensionsPath, 'extensions.json');
    if (!existsSync(extensionsJsonPath)) continue;

    try {
      const extensionsJson = JSON.parse(readFileSync(extensionsJsonPath, 'utf8')) as ExtensionEntry[];

      const filteredExtensions = extensionsJson.filter((ext) => ext.identifier?.id !== EXTENSION_ID_DEV);

      const newEntry: ExtensionEntry = {
        identifier: {
          id: EXTENSION_ID_DEV
        },
        version,
        location: {
          $mid: 1,
          path: join(extensionsPath, EXTENSION_ID_DEV),
          scheme: 'file'
        },
        relativeLocation: EXTENSION_ID_DEV
      };

      filteredExtensions.push(newEntry);

      writeFileSync(extensionsJsonPath, JSON.stringify(filteredExtensions, null, 2));
      logger.log(`✅ Registered in ${EDITOR_DISPLAY_NAMES[editor]} extensions.json`);
    } catch (error) {
      logger.log(`⚠️  Failed to register in ${EDITOR_DISPLAY_NAMES[editor]}: ${error}`);
    }
  }
}

function printSuccessMessage() {
  logger.log(`\n✅ Extension ID: ${EXTENSION_ID_DEV}`);
  logger.log('🔄 Reload editor to activate\n');
}

function transformContextKey(text: string): string {
  return text
    .replace(new RegExp(`\\b${CONTEXT_PREFIX}\\.`, 'g'), `${addDevSuffix(CONTEXT_PREFIX)}.`)
    .replace(/\b(\w+)(?=\s*==|\s*!=|\s|$)/g, (match) => {
      if (match.startsWith(CONTEXT_PREFIX) && !match.endsWith(DEV_SUFFIX)) {
        return addDevSuffix(match);
      }
      return match;
    });
}

function transformCommand(cmd: string): string {
  if (!cmd.startsWith(`${CONTEXT_PREFIX}.`)) return cmd;
  return cmd.replace(`${CONTEXT_PREFIX}.`, `${addDevSuffix(CONTEXT_PREFIX)}.`);
}

function transformTitle(title: string): string {
  if (title.startsWith(`${EXTENSION_DISPLAY_NAME}:`)) {
    return title.replace(`${EXTENSION_DISPLAY_NAME}:`, `${EXTENSION_DISPLAY_NAME} (${DEV_SUFFIX}):`);
  }
  return title;
}

function applyDevTransformations(pkg: Record<string, unknown>): Record<string, unknown> {
  const { type: _type, ...transformed } = pkg;

  transformed.name = `${EXTENSION_NAME}-dev`;
  transformed.displayName = addDevLabel(pkg.displayName as string);

  const contributes = transformed.contributes as Record<string, unknown>;
  if (!contributes) return transformed;

  if (contributes.viewsContainers) {
    const containers = contributes.viewsContainers as Record<string, unknown>;
    if (containers.activitybar) {
      containers.activitybar = (containers.activitybar as Array<{ id: string; title: string }>).map((container) => ({
        ...container,
        id: addDevSuffix(container.id),
        title: addDevLabel(container.title)
      }));
    }
  }

  if (contributes.views) {
    const views = contributes.views as Record<string, Array<{ id: string; name?: string; contextualTitle?: string }>>;
    const newViews: Record<string, unknown> = {};

    for (const [containerKey, viewList] of Object.entries(views)) {
      const newContainerKey = VSCODE_STANDARD_CONTAINERS.includes(containerKey)
        ? containerKey
        : addDevSuffix(containerKey);
      newViews[newContainerKey] = viewList.map((view) => ({
        ...view,
        id: addDevSuffix(view.id),
        name: view.name ? addDevLabel(view.name) : undefined,
        contextualTitle: view.contextualTitle ? addDevLabel(view.contextualTitle) : undefined
      }));
    }

    contributes.views = newViews;
  }

  if (contributes.viewsWelcome) {
    const viewsWelcome = contributes.viewsWelcome as Array<{ view: string; contents: string; when?: string }>;
    for (const welcome of viewsWelcome) {
      welcome.view = addDevSuffix(welcome.view);
      if (welcome.when) {
        welcome.when = transformContextKey(welcome.when);
      }
      if (welcome.contents) {
        welcome.contents = welcome.contents.replace(
          /\(command:([^)]+)\)/g,
          (_match, command: string) => `(command:${transformCommand(command)})`
        );
      }
    }
  }

  if (contributes.menus) {
    const menus = contributes.menus as Record<string, Array<{ when?: string; command?: string }>>;

    for (const menuList of Object.values(menus)) {
      for (const menu of menuList) {
        if (menu.when) {
          menu.when = transformContextKey(menu.when);
        }
        if (menu.command) {
          menu.command = transformCommand(menu.command);
        }
      }
    }
  }

  if (contributes.commands) {
    const commands = contributes.commands as Array<{
      command: string;
      title?: string;
      category?: string;
      enablement?: string;
    }>;
    for (const cmd of commands) {
      cmd.command = transformCommand(cmd.command);
      if (cmd.title) {
        cmd.title = transformTitle(cmd.title);
      }
      if (cmd.category) {
        cmd.category = addDevLabel(cmd.category);
      }
      if (cmd.enablement) {
        cmd.enablement = transformContextKey(cmd.enablement);
      }
    }
  }

  if (contributes.keybindings) {
    const keybindings = contributes.keybindings as Array<{ when?: string; command?: string }>;
    for (const binding of keybindings) {
      if (binding.when) {
        binding.when = transformContextKey(binding.when);
      }
      if (binding.command) {
        binding.command = transformCommand(binding.command);
      }
    }
  }

  if (contributes.configuration) {
    const configuration = contributes.configuration as { title?: string; properties?: Record<string, unknown> };
    if (configuration.title) {
      configuration.title = addDevLabel(configuration.title);
    }
    if (configuration.properties) {
      const newProperties: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(configuration.properties)) {
        const newKey = key.replace(`${CONTEXT_PREFIX}.`, `${addDevSuffix(CONTEXT_PREFIX)}.`);
        newProperties[newKey] = value;
      }
      configuration.properties = newProperties;
    }
  }

  return transformed;
}

main();
