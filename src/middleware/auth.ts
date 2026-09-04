import { Request, Response, NextFunction } from 'express';
import { supabaseAnon } from '../config/supabase.js';
import { UnauthorizedError } from '../utils/errors.js';

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authorization header missing or malformed');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Bearer token missing');
    }

    const { data, error } = await supabaseAnon.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedError('Invalid or expired authentication token');
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
      user_metadata: data.user.user_metadata,
      token,
    };


    next();
  } catch (error) {
    next(error);
  }
};
