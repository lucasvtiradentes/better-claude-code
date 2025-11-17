import * as vscode from 'vscode';
import type { DateGroup, SessionListItem } from '../common/types.js';

export class DateGroupTreeItem extends vscode.TreeItem {
  constructor(
    public readonly dateGroup: DateGroup,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(dateGroup.label, collapsibleState);
    this.tooltip = `${dateGroup.sessions.length} sessions`;
    this.iconPath = new vscode.ThemeIcon('calendar');
    this.contextValue = 'dateGroup';
  }
}

export class SessionTreeItem extends vscode.TreeItem {
  constructor(
    public readonly session: SessionListItem,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly isOpen: boolean = false,
    public readonly isPinned: boolean = false,
    public readonly isChecked: boolean = false
  ) {
    super('', collapsibleState);

    this.label = this.buildLabel();
    this.description = this.buildDescription();
    this.tooltip = this.buildTooltip();
    this.iconPath = this.buildIcon();

    if (this.isChecked) {
      this.contextValue = 'sessionItemChecked';
    } else {
      this.contextValue = session.hasCompaction ? 'sessionItemWithCompaction' : 'sessionItem';
    }

    this.resourceUri = vscode.Uri.parse(`claude-session:${session.id}`);
  }

  private buildIcon(): vscode.ThemeIcon {
    if (this.isChecked) {
      return new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green'));
    }

    if (this.isOpen) {
      return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.orange'));
    }

    const tokenPercentage = this.session.tokenPercentage || 0;

    if (tokenPercentage >= 90) {
      return new vscode.ThemeIcon('file-text', new vscode.ThemeColor('errorForeground'));
    }
    if (tokenPercentage >= 75) {
      return new vscode.ThemeIcon('file-text', new vscode.ThemeColor('editorWarning.foreground'));
    }
    if (tokenPercentage >= 50) {
      return new vscode.ThemeIcon('file-text', new vscode.ThemeColor('editorInfo.foreground'));
    }

    return new vscode.ThemeIcon('file-text');
  }

  private buildLabel(): string {
    const prefix = this.isPinned ? '📌 ' : '';
    return `${prefix}${this.session.tokenPercentage || 0}% • ${this.session.title}`;
  }

  private buildDescription(): string {
    const parts: string[] = [];

    if (this.session.imageCount) {
      parts.push(`${this.session.imageCount} img`);
    }

    if (this.session.filesOrFoldersCount) {
      parts.push(`${this.session.filesOrFoldersCount} files`);
    }

    if (this.session.messageCount > 0) {
      parts.push(`${this.session.messageCount} msgs`);
    }

    return parts.join(' • ');
  }

  private buildTooltip(): string {
    const lines: string[] = [];

    lines.push(this.session.title);
    lines.push('');

    if (this.session.shortId) {
      lines.push(`ID: ${this.session.shortId}`);
    }

    lines.push(`Messages: ${this.session.messageCount}`);

    if (this.session.userMessageCount !== undefined) {
      lines.push(`  User: ${this.session.userMessageCount}`);
    }

    if (this.session.assistantMessageCount !== undefined) {
      lines.push(`  Assistant: ${this.session.assistantMessageCount}`);
    }

    if (this.session.tokenPercentage) {
      lines.push(`Tokens: ${this.session.tokenPercentage}%`);
    }

    if (this.session.imageCount) {
      lines.push(`Images: ${this.session.imageCount}`);
    }

    if (this.session.customCommandCount) {
      lines.push(`Custom Commands: ${this.session.customCommandCount}`);
    }

    if (this.session.filesOrFoldersCount) {
      lines.push(`Files/Folders Referenced: ${this.session.filesOrFoldersCount}`);
    }

    if (this.session.urlCount) {
      lines.push(`URLs: ${this.session.urlCount}`);
    }

    const createdDate = new Date(this.session.createdAt);
    lines.push('');
    lines.push(`Created: ${createdDate.toLocaleString()}`);

    if (this.session.summary) {
      lines.push('');
      lines.push('Summary:');
      lines.push(this.session.summary);
    }

    if (this.session.hasCompaction) {
      lines.push('');
      lines.push('✓ Compaction available');
    }

    return lines.join('\n');
  }
}
