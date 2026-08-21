"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.logout = exports.refreshToken = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const response_1 = require("../utils/response");
/*export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      errorResponse(res, 'اسم المستخدم وكلمة المرور مطلوبان', 400);
      return;
    }

    // Fetch user with role and company info
    const result = await query(
      `SELECT u.id, u.username, u.password_hash, u.name_ar, u.name_en,
              u.email, u.status, u.language, u.role_id, u.company_id, u.branch_id,
              r.name_ar as role_name_ar, r.name_en as role_name_en,
              c.name_ar as company_name_ar
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE u.username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      errorResponse(res, 'اسم المستخدم أو كلمة المرور غير صحيحة', 401);
      return;
    }

    const user = result.rows[0];

    if (user.status !== 'Active') {
      errorResponse(res, 'الحساب غير نشط. يرجى التواصل مع مدير النظام', 401);
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      errorResponse(res, 'اسم المستخدم أو كلمة المرور غير صحيحة', 401);
      return;
    }

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Log the login event
    await query(
      `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, ip_address, user_agent)
       VALUES ($1, 'LOGIN', 'users', $1, 'User login', $2, $3)`,
      [user.id, req.ip, req.headers['user-agent'] || '']
    );

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      roleId: user.role_id,
      companyId: user.company_id,
      branchId: user.branch_id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || '', {
      expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any,
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || '',
      { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
    );

    successResponse(res, {
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        nameAr: user.name_ar,
        nameEn: user.name_en,
        email: user.email,
        language: user.language,
        roleId: user.role_id,
        roleNameAr: user.role_name_ar,
        roleNameEn: user.role_name_en,
        companyId: user.company_id,
        companyNameAr: user.company_name_ar,
        branchId: user.branch_id,
      },
    }, 'تم تسجيل الدخول بنجاح');

  } catch (error) {
    console.error('Login error:', error);
    errorResponse(res, 'حدث خطأ أثناء تسجيل الدخول', 500);
  }
};*/
const login = async (req, res) => {
    try {
        console.log('[LOGIN] 1 - Request received');
        const { username, password } = req.body;
        if (!username || !password) {
            (0, response_1.errorResponse)(res, 'اسم المستخدم وكلمة المرور مطلوبان', 400);
            return;
        }
        console.log('[LOGIN] 2 - Credentials received:', username);
        const result = await (0, db_1.query)(`SELECT u.id, u.username, u.password_hash, u.name_ar, u.name_en, 
              u.email, u.status, u.language, u.role_id, u.company_id, u.branch_id,
              r.name_ar as role_name_ar, r.name_en as role_name_en,
              c.name_ar as company_name_ar
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE u.username = $1`, [username]);
        console.log('[LOGIN] 3 - User query completed');
        if (result.rows.length === 0) {
            (0, response_1.errorResponse)(res, 'اسم المستخدم أو كلمة المرور غير صحيحة', 401);
            return;
        }
        const user = result.rows[0];
        console.log('[LOGIN] 4 - User found');
        if (user.status !== 'Active') {
            (0, response_1.errorResponse)(res, 'الحساب غير نشط. يرجى التواصل مع مدير النظام', 401);
            return;
        }
        console.log('[LOGIN] 5 - Checking password');
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password_hash);
        console.log('[LOGIN] 6 - Password checked');
        if (!isPasswordValid) {
            (0, response_1.errorResponse)(res, 'اسم المستخدم أو كلمة المرور غير صحيحة', 401);
            return;
        }
        console.log('[LOGIN] 7 - Updating last login');
        await (0, db_1.query)('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
        console.log('[LOGIN] 8 - Last login updated');
        await (0, db_1.query)(`INSERT INTO audit_logs 
       (user_id, action_type, table_name, record_id, description, ip_address, user_agent)
       VALUES ($1, 'LOGIN', 'users', $1, 'User login', $2, $3)`, [user.id, req.ip, req.headers['user-agent'] || '']);
        console.log('[LOGIN] 9 - Audit log inserted');
        const payload = {
            userId: user.id,
            username: user.username,
            roleId: user.role_id,
            companyId: user.company_id,
            branchId: user.branch_id,
        };
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || '', {
            expiresIn: (process.env.JWT_EXPIRES_IN || '8h'),
        });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET || '', {
            expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d'),
        });
        console.log('[LOGIN] 10 - JWT generated');
        (0, response_1.successResponse)(res, {
            token,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                nameAr: user.name_ar,
                nameEn: user.name_en,
                email: user.email,
                language: user.language,
                roleId: user.role_id,
                roleNameAr: user.role_name_ar,
                roleNameEn: user.role_name_en,
                companyId: user.company_id,
                companyNameAr: user.company_name_ar,
                branchId: user.branch_id,
            },
        }, 'تم تسجيل الدخول بنجاح');
        console.log('[LOGIN] 11 - Response sent');
    }
    catch (error) {
        console.error('[LOGIN] ERROR:', error);
        (0, response_1.errorResponse)(res, 'حدث خطأ أثناء تسجيل الدخول', 500);
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;
        if (!token) {
            (0, response_1.errorResponse)(res, 'رمز التحديث مطلوب', 400);
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET || '');
        const result = await (0, db_1.query)(`SELECT u.id, u.username, u.status, u.role_id, u.company_id, u.branch_id
       FROM users u WHERE u.id = $1`, [decoded.userId]);
        if (result.rows.length === 0 || result.rows[0].status !== 'Active') {
            (0, response_1.errorResponse)(res, 'الجلسة غير صالحة', 401);
            return;
        }
        const user = result.rows[0];
        const payload = {
            userId: user.id,
            username: user.username,
            roleId: user.role_id,
            companyId: user.company_id,
            branchId: user.branch_id,
        };
        const newToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || '', {
            expiresIn: (process.env.JWT_EXPIRES_IN || '8h'),
        });
        (0, response_1.successResponse)(res, { token: newToken }, 'تم تجديد الرمز بنجاح');
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'رمز التحديث غير صالح أو منتهي الصلاحية', 401);
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, res) => {
    try {
        if (req.user) {
            await (0, db_1.query)(`INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, ip_address)
         VALUES ($1, 'LOGOUT', 'users', $1, 'User logout', $2)`, [req.user.userId, req.ip]);
        }
        (0, response_1.successResponse)(res, null, 'تم تسجيل الخروج بنجاح');
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'حدث خطأ أثناء تسجيل الخروج', 500);
    }
};
exports.logout = logout;
const getProfile = async (req, res) => {
    try {
        const result = await (0, db_1.query)(`SELECT u.id, u.username, u.name_ar, u.name_en, u.email, u.language,
              u.status, u.last_login, u.created_at,
              r.name_ar as role_name_ar, r.name_en as role_name_en,
              c.name_ar as company_name_ar, c.logo_path,
              b.name_ar as branch_name_ar
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       LEFT JOIN companies c ON c.id = u.company_id
       LEFT JOIN branches b ON b.id = u.branch_id
       WHERE u.id = $1`, [req.user.userId]);
        if (result.rows.length === 0) {
            (0, response_1.errorResponse)(res, 'المستخدم غير موجود', 404);
            return;
        }
        // Get permissions
        const permsResult = await (0, db_1.query)(`SELECT module_name, screen_name, can_view, can_create, can_edit, 
              can_delete, can_approve, can_print, can_export
       FROM permissions WHERE role_id = $1`, [req.user.roleId]);
        (0, response_1.successResponse)(res, {
            ...result.rows[0],
            permissions: permsResult.rows,
        });
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'حدث خطأ في جلب بيانات المستخدم', 500);
    }
};
exports.getProfile = getProfile;
//# sourceMappingURL=authController.js.map