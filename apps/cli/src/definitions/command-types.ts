import type { SubCommand } from './types.js';

export type FlagType<T extends SubCommand> = T extends { flags: Array<infer F> }
  ? F extends { name: string; type: infer Type; required?: boolean }
    ? Type extends 'string'
      ? string
      : Type extends 'number'
        ? number
        : Type extends 'boolean'
          ? boolean
          : never
    : never
  : never;

export type FlagsToOptions<T extends SubCommand> = T extends { flags: ReadonlyArray<infer F> }
  ? F extends { name: infer N; alias?: string; type: infer Type; required?: infer Req }
    ? N extends string
      ? {
          [K in N extends `--${infer Name}` ? Name : N]: Type extends 'string'
            ? Req extends true
              ? string
              : string | undefined
            : Type extends 'number'
              ? Req extends true
                ? number
                : number | undefined
              : Type extends 'boolean'
                ? boolean | undefined
                : never;
        }
      : never
    : never
  : Record<string, never>;

export type SubCommandOptions<T extends SubCommand> = T extends { flags: ReadonlyArray<unknown> }
  ? UnionToIntersection<FlagsToOptions<T>>
  : Record<string, never>;

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
