import type { Request, Response } from 'express';
import { handleVercelRequest } from '../server.ts';

export const config = {
  maxDuration: 30,
};

export default function handler(req: Request, res: Response) {
  return handleVercelRequest(req, res);
}
