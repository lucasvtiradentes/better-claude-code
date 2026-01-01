import { CONTEXT_PREFIX } from '@/common/utils/scripts-constants';
import type { WorkspaceUIState } from '../schemas/workspace-state.schema';
import type { ExtensionContext } from '../vscode/vscode-types';

const WORKSPACE_STATE_KEY = `${CONTEXT_PREFIX}.workspaceState`;

export enum StateKey {
  SessionProvider = 'sessionProvider',
  MessageFilters = 'messageFilters'
}

export enum StorageType {
  Workspace = 'workspace'
}

type BaseStateManager<T> = {
  load(): T;
  save(state: T): void;
};

export type StateManager<T> = BaseStateManager<T>;

let workspaceContext: ExtensionContext | null = null;

export function initWorkspaceState(context: ExtensionContext): void {
  workspaceContext = context;
}

function getWorkspaceState(): WorkspaceUIState {
  if (!workspaceContext) return {};
  return workspaceContext.workspaceState.get<WorkspaceUIState>(WORKSPACE_STATE_KEY) ?? {};
}

function saveWorkspaceState(state: WorkspaceUIState): void {
  if (!workspaceContext) return;
  void workspaceContext.workspaceState.update(WORKSPACE_STATE_KEY, state);
}

export function loadWorkspaceState(): WorkspaceUIState {
  return getWorkspaceState();
}

export function clearWorkspaceState(): void {
  if (!workspaceContext) return;
  const keys = workspaceContext.workspaceState.keys();
  for (const key of keys) {
    void workspaceContext.workspaceState.update(key, undefined);
  }
}

type StateManagerConfig<T> = {
  stateKey: StateKey;
  defaultState: T;
  storageType: StorageType;
};

export function createStateManager<T extends Record<string, unknown>>(config: StateManagerConfig<T>): StateManager<T> {
  const { stateKey, defaultState } = config;

  return {
    load(): T {
      const state = getWorkspaceState();
      return (state[stateKey as keyof typeof state] ?? { ...defaultState }) as T;
    },

    save(newState: T): void {
      const state = getWorkspaceState();
      (state as Record<string, unknown>)[stateKey] = newState;
      saveWorkspaceState(state);
    }
  };
}
