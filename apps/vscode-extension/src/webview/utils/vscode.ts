import type { VSCodeAPI } from '../types';

declare const acquireVsCodeApi: () => VSCodeAPI;

export const vscode = acquireVsCodeApi();
