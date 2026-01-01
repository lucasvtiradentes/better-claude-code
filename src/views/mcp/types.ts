export type MCPServerConfig = {
  type?: 'http' | 'sse' | 'stdio';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
};

export type MCPServerInfo = {
  name: string;
  filePath: string;
  lineNumber: number;
  isGlobal: boolean;
  isProjectScope: boolean;
  config: MCPServerConfig;
};

export type MCPConfigFile = {
  mcpServers?: Record<string, MCPServerConfig>;
};
