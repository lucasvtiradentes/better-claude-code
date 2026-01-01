import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

type ClaudeConfig = {
  disabledMcpServers?: string[];
  projects?: Record<string, { disabledMcpServers?: string[] }>;
};

function getClaudeConfigPath(): string {
  return path.join(os.homedir(), '.claude.json');
}

function readClaudeConfig(): ClaudeConfig {
  const configPath = getClaudeConfigPath();
  if (!fs.existsSync(configPath)) {
    return {};
  }
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as ClaudeConfig;
  } catch {
    return {};
  }
}

function writeClaudeConfig(config: ClaudeConfig): void {
  const configPath = getClaudeConfigPath();
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const fullConfig = JSON.parse(content);
    if (config.disabledMcpServers !== undefined) {
      fullConfig.disabledMcpServers = config.disabledMcpServers;
    }
    if (config.projects) {
      fullConfig.projects = fullConfig.projects || {};
      for (const [projectPath, projectConfig] of Object.entries(config.projects)) {
        fullConfig.projects[projectPath] = fullConfig.projects[projectPath] || {};
        fullConfig.projects[projectPath].disabledMcpServers = projectConfig.disabledMcpServers;
      }
    }
    fs.writeFileSync(configPath, JSON.stringify(fullConfig, null, 2));
  } catch {
    // Ignore write errors
  }
}

export function getGlobalDisabledMCPServers(): string[] {
  const config = readClaudeConfig();
  return config.disabledMcpServers || [];
}

export function getProjectDisabledMCPServers(workspacePath: string): string[] {
  const config = readClaudeConfig();
  return config.projects?.[workspacePath]?.disabledMcpServers || [];
}

export function isMCPServerEnabled(serverName: string, isGlobal: boolean, workspacePath?: string): boolean {
  if (isGlobal) {
    const disabled = getGlobalDisabledMCPServers();
    return !disabled.includes(serverName);
  }
  if (workspacePath) {
    const disabled = getProjectDisabledMCPServers(workspacePath);
    return !disabled.includes(serverName);
  }
  return true;
}

export function toggleMCPServer(serverName: string, isGlobal: boolean, workspacePath?: string): boolean {
  if (isGlobal) {
    const disabled = getGlobalDisabledMCPServers();
    const isCurrentlyDisabled = disabled.includes(serverName);

    if (isCurrentlyDisabled) {
      writeClaudeConfig({
        disabledMcpServers: disabled.filter((name) => name !== serverName)
      });
      return true;
    }
    writeClaudeConfig({
      disabledMcpServers: [...disabled, serverName]
    });
    return false;
  }

  if (workspacePath) {
    const disabled = getProjectDisabledMCPServers(workspacePath);
    const isCurrentlyDisabled = disabled.includes(serverName);

    if (isCurrentlyDisabled) {
      writeClaudeConfig({
        projects: {
          [workspacePath]: {
            disabledMcpServers: disabled.filter((name) => name !== serverName)
          }
        }
      });
      return true;
    }
    writeClaudeConfig({
      projects: {
        [workspacePath]: {
          disabledMcpServers: [...disabled, serverName]
        }
      }
    });
    return false;
  }

  return true;
}
