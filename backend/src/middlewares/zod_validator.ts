import type { Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

type RequestPart = "body" | "query" | "params";

export const validate = <TOutput>(
  schema: ZodType<TOutput>,
  part: RequestPart
): RequestHandler => {
  return async (req: Request, res: Response, next) => {
    try {
      res.locals.validated = await schema.parseAsync(req[part]);
      next();
    } catch (error) {
      next(error);
    }
  };
};
