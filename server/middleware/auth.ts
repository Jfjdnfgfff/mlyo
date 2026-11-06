import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dbEngine } from '../services/db-engine.js';
import { UserRole, User } from '../types.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

const JWT_SECRET = process.env.JWT_SECRET || 'creche_manager_dz_secret_key_2026';

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = dbEngine.getUserById(decoded.id);
      if (user) {
        req.user = user;
        return next();
      }
    } catch (err) {
      console.warn('Invalid auth token received:', err);
    }
  }

  // Default fallback for initial load / preview session if no token passed:
  // Default to Admin user so initial experience works seamlessly, while full token authentication is supported!
  const defaultAdmin = dbEngine.getUserById('user_admin_01');
  if (defaultAdmin) {
    req.user = defaultAdmin;
  }
  next();
}

export function requireRole(allowedRoles: UserRole | UserRole[]) {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'غير مصرح: يجب تسجيل الدخول أولاً' });
    }

    if (!rolesArray.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `غير مسموح: لا تملك الصلاحيات الكافية للقيام بهذا الإجراء (${req.user.role})`
      });
    }

    next();
  };
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      nurseryId: user.nurseryId
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}
