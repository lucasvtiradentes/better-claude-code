import * as fs from 'node:fs';
import type { MCPConfigFile, MCPServerConfig, MCPServerInfo } from './types';

function findLineNumber(content: string, serverName: string): number {
  const lines = content.split('\n');
  const pattern = new RegExp(`"${serverName}"\\s*:`);

  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      return i + 1;
    }
  }
  return 1;
}

type ClaudeJsonConfig = MCPConfigFile & {
  projects?: Record<string, { mcpServers?: Record<string, MCPServerConfig> }>;
};

export function parseMCPConfigFile(filePath: string, isGlobal: boolean, isProjectScope: boolean): MCPServerInfo[] {
  const servers: MCPServerInfo[] = [];

  if (!fs.existsSync(filePath)) {
    return servers;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const config: MCPConfigFile = JSON.parse(content);

    if (!config.mcpServers || typeof config.mcpServers !== 'object') {
      return servers;
    }

    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      const lineNumber = findLineNumber(content, name);
      servers.push({
        name,
        filePath,
        lineNumber,
        isGlobal,
        isProjectScope,
        config: serverConfig as MCPServerConfig
      });
    }
  } catch {
    return servers;
  }

  return servers.sort((a, b) => a.name.localeCompare(b.name));
}

export function parseLocalScopeMCPConfig(filePath: string, workspacePath: string): MCPServerInfo[] {
  const servers: MCPServerInfo[] = [];

  if (!fs.existsSync(filePath)) {
    return servers;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const config: ClaudeJsonConfig = JSON.parse(content);

    const projectConfig = config.projects?.[workspacePath];
    if (!projectConfig?.mcpServers || typeof projectConfig.mcpServers !== 'object') {
      return servers;
    }

    for (const [name, serverConfig] of Object.entries(projectConfig.mcpServers)) {
      const lineNumber = findLineNumber(content, name);
      servers.push({
        name,
        filePath,
        lineNumber,
        isGlobal: false,
        isProjectScope: false,
        config: serverConfig as MCPServerConfig
      });
    }
  } catch {
    return servers;
  }

  return servers.sort((a, b) => a.name.localeCompare(b.name));
}

export function parseProjectMCPConfig(filePath: string): MCPServerInfo[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const config = JSON.parse(content);
    const servers: MCPServerInfo[] = [];

    const mcpServers = config.mcpServers || config;

    if (typeof mcpServers !== 'object') {
      return [];
    }

    for (const [name, serverConfig] of Object.entries(mcpServers)) {
      if (typeof serverConfig === 'object' && serverConfig !== null) {
        const lineNumber = findLineNumber(content, name);
        servers.push({
          name,
          filePath,
          lineNumber,
          isGlobal: false,
          isProjectScope: true,
          config: serverConfig as MCPServerConfig
        });
      }
    }

    return servers.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}
