import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';

export interface JwtPayload {
  userId: string;
  username: string;
  roleId: string;
  companyId: string;
  branchId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'غير مصرح - يرجى تسجيل الدخول' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as JwtPayload;

    // Verify user still exists and is active
    const result = await query(
      'SELECT id, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0 || result.rows[0].status !== 'Active') {
      res.status(401).json({ success: false, message: 'الحساب غير نشط أو غير موجود' });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'رمز المصادقة غير صالح أو منتهي الصلاحية' });
  }
};

export const authorize = (module: string, screen: string, action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'print' | 'export') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'غير مصرح' });
        return;
      }

      const actionMap = {
        view: 'can_view',
        create: 'can_create',
        edit: 'can_edit',
        delete: 'can_delete',
        approve: 'can_approve',
        print: 'can_print',
        export: 'can_export',
      };

      const column = actionMap[action];
      const result = await query(
        `SELECT ${column} FROM permissions 
         WHERE role_id = $1 AND module_name = $2 AND screen_name = $3`,
        [req.user.roleId, module, screen]
      );

      if (result.rows.length === 0 || !result.rows[0][column]) {
        res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية للوصول إلى هذا القسم'
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ success: false, message: 'خطأ في التحقق من الصلاحيات' });
    }
  };
};
