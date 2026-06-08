/**
 * JWT Authentication Middleware
 * Validates Bearer tokens on protected routes.
 * Attaches the decoded user payload to req.user.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';

// Extend Express Request type for typed user access
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

/**
 * Validates the JWT Bearer token and attaches user to req.user.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided. Use: Authorization: Bearer <token>');
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token has expired. Please log in again.');
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token. Please log in again.');
    }
    throw err;
  }
};
