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
import { join } from 'node:path';
import { VSCODE_EXTENSIONS_DIR } from '@/lib/node-utils';

const DEV_SUFFIX = 'Dev';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const extensionName = `${packageJson.publisher}.${packageJson.name}-dev`;
const targetDir = join(VSCODE_EXTENSIONS_DIR, extensionName);

if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true });
}

mkdirSync(targetDir, { recursive: true });

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

function addDevSuffix(str: string): string {
  return `${str}${DEV_SUFFIX}`;
}

function addDevLabel(str: string): string {
  return `${str} (Dev)`;
}

function applyDevTransformations(pkg: Record<string, unknown>): Record<string, unknown> {
  const transformed = { ...pkg };

  transformed.name = `${pkg.name}-dev`;
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
    const views = contributes.views as Record<string, Array<{ id: string; contextualTitle?: string }>>;
    const newViews: Record<string, unknown> = {};

    for (const [containerKey, viewList] of Object.entries(views)) {
      const newContainerKey = addDevSuffix(containerKey);
      newViews[newContainerKey] = viewList.map((view) => ({
        ...view,
        id: addDevSuffix(view.id),
        contextualTitle: view.contextualTitle ? addDevLabel(view.contextualTitle) : undefined
      }));
    }

    contributes.views = newViews;
  }

  if (contributes.menus) {
    const menus = contributes.menus as Record<string, Array<{ when?: string }>>;

    for (const menuList of Object.values(menus)) {
      for (const menu of menuList) {
        if (menu.when) {
          menu.when = menu.when.replace(/(\w+)(?=\s|$|==)/g, (match) => {
            if (match.startsWith('bcc') && !match.endsWith(DEV_SUFFIX)) {
              return addDevSuffix(match);
            }
            return match;
          });
        }
      }
    }
  }

  if (contributes.keybindings) {
    const keybindings = contributes.keybindings as Array<{ when?: string }>;

    for (const binding of keybindings) {
      if (binding.when) {
        binding.when = binding.when.replace(/(\w+)(?=\s|$|==)/g, (match) => {
          if (match.startsWith('bcc') && !match.endsWith(DEV_SUFFIX)) {
            return addDevSuffix(match);
          }
          return match;
        });
      }
    }
  }

  return transformed;
}

copyRecursive('out', join(targetDir, 'out'));
copyRecursive('resources', join(targetDir, 'resources'));

const modifiedPackageJson = applyDevTransformations(packageJson);
writeFileSync(join(targetDir, 'package.json'), JSON.stringify(modifiedPackageJson, null, '\t'));

if (existsSync('README.md')) {
  copyFileSync('README.md', join(targetDir, 'README.md'));
}

console.log(`\n✅ Extension installed to: ${targetDir}`);
console.log(`   Extension name: ${extensionName}`);
console.log(`\n🔄 Reload VSCode to activate the extension:`);
console.log(`   - Press Ctrl+Shift+P`);
console.log(`   - Type "Reload Window" and press Enter\n`);
