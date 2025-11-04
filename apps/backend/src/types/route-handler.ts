import type { Context } from 'hono';
import type { z } from 'zod';

export type TypedContext<TParams extends z.ZodTypeAny = z.ZodNever, TQuery extends z.ZodTypeAny = z.ZodNever> = Context<
  any,
  any,
  {
    in: {
      param: TParams extends z.ZodNever ? unknown : z.infer<TParams>;
      query: TQuery extends z.ZodNever ? unknown : z.infer<TQuery>;
    };
    out: {
      param: TParams extends z.ZodNever ? unknown : z.infer<TParams>;
      query: TQuery extends z.ZodNever ? unknown : z.infer<TQuery>;
    };
  }
>;
