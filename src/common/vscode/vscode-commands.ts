import * as vscode from 'vscode';
import { addDevSuffix, CONTEXT_PREFIX, IS_DEV } from '@/common/utils';
import type { CommandParams } from '../../commands/command-params';
import type { Disposable } from './vscode-types';

export enum Command {
  RefreshSessions = 'refreshSessions',
  CompactSession = 'compactSession',
  FilterSessions = 'filterSessions',
  OpenSessionFile = 'openSessionFile',
  CopySessionPath = 'copySessionPath',
  ShowLogs = 'showLogs',
  ShowWorkspaceState = 'showWorkspaceState',
  ClearWorkspaceState = 'clearWorkspaceState',
  AddLabel = 'addLabel',
  ToggleCollapseExpand = 'toggleCollapseExpand',
  ViewCompaction = 'viewCompaction',
  TogglePinSession = 'togglePinSession',
  BatchCompact = 'batchCompact',
  BatchDelete = 'batchDelete',
  BatchAddLabel = 'batchAddLabel',
  ToggleCheckSession = 'toggleCheckSession',
  ClearAllChecks = 'clearAllChecks',
  BatchOperationsMenu = 'batchOperationsMenu',
  ViewSessionDetails = 'viewSessionDetails',
  OpenSettingsMenu = 'openSettingsMenu',
  OpenGlobalSettings = 'openGlobalSettings',
  OpenGlobalInstructions = 'openGlobalInstructions'
}

export enum ContextKey {
  HasCheckedSessions = 'hasCheckedSessions'
}

function getPrefix(): string {
  return IS_DEV ? addDevSuffix(CONTEXT_PREFIX) : CONTEXT_PREFIX;
}

export function getCommandId(command: Command | string): string {
  return `${getPrefix()}.${command}`;
}

function getContextKeyId(key: ContextKey | string): string {
  return `${getPrefix()}.${key}`;
}

export function setContextKey(key: ContextKey, value: unknown): Thenable<unknown> {
  return vscode.commands.executeCommand('setContext', getContextKeyId(key), value);
}

// tscanner-ignore-next-line no-explicit-any
export function registerCommand(command: Command, callback: (...args: any[]) => any): Disposable {
  return vscode.commands.registerCommand(getCommandId(command), callback);
}

export function executeCommand<T extends Command>(
  command: T,
  ...args: T extends keyof CommandParams ? [CommandParams[T]] : []
): Thenable<unknown> {
  return vscode.commands.executeCommand(getCommandId(command), ...args);
}
