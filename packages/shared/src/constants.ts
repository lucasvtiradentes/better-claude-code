export const APP_NAME = 'Better Claude Code';

export const APP_CLI_NAME = 'bcc';

export const APP_DESCRIPTION = 'CLI auxiliary tools for Claude Code';

export const FRONTEND_PORT = 5001;

export const BACKEND_PORT = 5000;

export const API_PREFIX = '/api';

export const SWAGGER_UI_PATH = '/swagger';

export const OPENAPI_SPEC_PATH = '/openapi.json';

export const createLocalHostLink = (port: number, sufix?: string) => `http://localhost:${port}${sufix ?? ''}`;
