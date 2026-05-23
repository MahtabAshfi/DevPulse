import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '../utils/response';

export interface TokenPayload {
  id: number;
  name: string;
  role: 'contributor' | 'maintainer';
}

declare global {
  namespace Express {
    interface Request { user?: TokenPayload; }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  if (!token) {
    return sendError(res, StatusCodes.UNAUTHORIZED, "Authorization header is missing");
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;
    next();
  } catch {
    sendError(res, StatusCodes.UNAUTHORIZED, "Invalid or expired JWT token");
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, StatusCodes.FORBIDDEN, "Insufficient role permissions");
    }
    next();
  };
};