import { Request, Response, NextFunction } from 'express';
import { Role } from '../generated/prisma/enums';

export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      if (!allowedRoles.includes(user.role as Role)) {
        return res.status(403).json({
          error: `Forbidden - Requires one of the following roles: ${allowedRoles.join(', ')}`
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};
