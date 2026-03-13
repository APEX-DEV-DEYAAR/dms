import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as Record<string, any>;

      // Merge parsed values back so transforms (e.g. string→number) are available
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.issues.map((e) => `${e.path.map(String).join('.')}: ${e.message}`);
        return res.status(400).json({
          error: 'Validation failed',
          details: messages,
          statusCode: 400,
        });
      }
      next(err);
    }
  };
}
