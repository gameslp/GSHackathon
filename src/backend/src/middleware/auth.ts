import { Request, Response, NextFunction } from 'express';

import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.SECRET;

if (!SECRET) {
  throw new Error('Auth token is not set');
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
  console.log("AUTHENTICATING...");
  next();
};