import { type ChildProcess, type SpawnOptions, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  accessSync,
  appendFileSync,
  type Dirent,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  type Stats,
  statSync,
  unlinkSync,
  writeFileSync
} from 'node:fs';
import { access, mkdir, readdir, readFile, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { homedir, platform, release, tmpdir } from 'node:os';
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  normalize,
  type ParsedPath,
  parse,
  posix,
  relative,
  resolve,
  sep
} from 'node:path';

export const UTF_ENCODING: BufferEncoding = 'utf-8';

export class NodePathHelper {
  static join(...paths: string[]): string {
    return join(...paths);
  }

  static resolve(...paths: string[]): string {
    return resolve(...paths);
  }

  static dirname(filePath: string): string {
    return dirname(filePath);
  }

  static basename(filePath: string, ext?: string): string {
    return basename(filePath, ext);
  }

  static extname(filePath: string): string {
    return extname(filePath);
  }

  static parse(filePath: string): ParsedPath {
    return parse(filePath);
  }

  static relative(from: string, to: string): string {
    return relative(from, to);
  }

  static isAbsolute(filePath: string): boolean {
    return isAbsolute(filePath);
  }

  static normalize(filePath: string): string {
    return normalize(filePath);
  }

  static get sep(): string {
    return sep;
  }

  static get posix() {
    return {
      join: (...paths: string[]) => posix.join(...paths),
      dirname: (filePath: string) => posix.dirname(filePath),
      basename: (filePath: string, ext?: string) => posix.basename(filePath, ext),
      extname: (filePath: string) => posix.extname(filePath),
      relative: (from: string, to: string) => posix.relative(from, to),
      resolve: (...paths: string[]) => posix.resolve(...paths),
      normalize: (filePath: string) => posix.normalize(filePath),
      isAbsolute: (filePath: string) => posix.isAbsolute(filePath),
      parse: (filePath: string) => posix.parse(filePath),
      sep: posix.sep
    };
  }
}

export class FileIOHelper {
  static fileExists(filePath: string): boolean {
    return existsSync(filePath);
  }

  static readFileIfExists(filePath: string): string | null {
    if (!existsSync(filePath)) {
      return null;
    }

    try {
      return FileIOHelper.readFile(filePath);
    } catch {
      return null;
    }
  }

  static readFile(filePath: string): string {
    return readFileSync(filePath, UTF_ENCODING);
  }

  static writeFile(filePath: string, content: string) {
    writeFileSync(filePath, content, UTF_ENCODING);
  }

  static appendFile(filePath: string, content: string) {
    appendFileSync(filePath, content, UTF_ENCODING);
  }

  static ensureDirectoryExists(dirPath: string) {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }

  static deleteFile(filePath: string) {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  static readDirectory(dirPath: string): string[];
  static readDirectory(dirPath: string, options: { withFileTypes: true }): Dirent[];
  static readDirectory(dirPath: string, options: { withFileTypes: false }): string[];
  static readDirectory(dirPath: string, options?: { withFileTypes?: boolean }): string[] | Dirent[] {
    if (!existsSync(dirPath)) {
      return [];
    }
    if (options?.withFileTypes) {
      return readdirSync(dirPath, { withFileTypes: true });
    }
    return readdirSync(dirPath);
  }

  static stat(filePath: string): Stats {
    return statSync(filePath);
  }

  static accessSync(filePath: string, mode?: number) {
    return accessSync(filePath, mode);
  }

  static async mkdirAsync(dirPath: string, options?: { recursive?: boolean }) {
    return mkdir(dirPath, options);
  }

  static async readFileAsync(filePath: string): Promise<string> {
    return readFile(filePath, UTF_ENCODING);
  }

  static async writeFileAsync(filePath: string, content: string) {
    return writeFile(filePath, content, UTF_ENCODING);
  }

  static async unlinkAsync(filePath: string) {
    return unlink(filePath);
  }

  static async rmAsync(dirPath: string, options?: { recursive?: boolean; force?: boolean }) {
    return rm(dirPath, options);
  }

  static async readdirAsync(dirPath: string): Promise<string[]>;
  static async readdirAsync(dirPath: string, options: { withFileTypes: true }): Promise<Dirent[]>;
  static async readdirAsync(dirPath: string, options: { withFileTypes: false }): Promise<string[]>;
  static async readdirAsync(dirPath: string, options?: { withFileTypes?: boolean }): Promise<string[] | Dirent[]> {
    if (options?.withFileTypes) {
      return readdir(dirPath, { withFileTypes: true });
    }
    return readdir(dirPath);
  }

  static async statAsync(filePath: string): Promise<Stats> {
    return stat(filePath);
  }

  static async accessAsync(filePath: string, mode?: number) {
    return access(filePath, mode);
  }
}

export class NodeOsHelper {
  static homedir = homedir;
  static tmpdir = tmpdir;
  static platform = platform;
  static release = release;
}

export class NodeCryptoHelper {
  static randomUUID = randomUUID;
}

export class NodeChildProcessHelper {
  static spawn(command: string, args: string[], options: SpawnOptions): ChildProcess {
    return spawn(command, args, options);
  }
}
