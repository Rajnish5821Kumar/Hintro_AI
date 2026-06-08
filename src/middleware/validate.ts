/**
 * Validation Middleware Factory
 * Creates Express middleware that validates req.body / req.params / req.query
 * against a Zod schema. Throws ValidationError on failure.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

type ValidateTarget = 'body' | 'params' | 'query';

/**
 * Returns Express middleware that validates the specified request target
 * against the provided Zod schema.
 */
export const validate =
  (schema: ZodSchema, target: ValidateTarget = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      // Replace with the parsed (and coerced) data
      (req as unknown as Record<string, unknown>)[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        throw new ValidationError('Request validation failed', details);
      }
      throw err;
    }
  };
