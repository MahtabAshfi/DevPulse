import type { Response } from 'express';

export const sendSuccess = (res: Response, status: number, message: string, data?: unknown) => {
  res.status(status).json({ success: true, message, data });
};

export const sendError = (res: Response, status: number, message: string, errors?: unknown) => {
  res.status(status).json({ success: false, message, errors });
};