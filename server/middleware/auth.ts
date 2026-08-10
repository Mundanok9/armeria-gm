import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../src/types/index';

export const JWT_SECRET = process.env.JWT_SECRET || 'armeria-gm-secret-key-2026-safe-production';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    matricula: string;
    nome: string;
    role: UserRole;
  };
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido ou expirado.' });
      }
      req.user = decoded as AuthenticatedRequest['user'];
      next();
    });
  } else {
    return res.status(401).json({ error: 'Autorização necessária. Token não fornecido.' });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente para esta ação.' });
    }
    next();
  };
}
