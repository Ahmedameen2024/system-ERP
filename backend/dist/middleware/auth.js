"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: 'غير مصرح - يرجى تسجيل الدخول' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || '');
        // Verify user still exists and is active
        const result = await (0, db_1.query)('SELECT id, status FROM users WHERE id = $1', [decoded.userId]);
        if (result.rows.length === 0 || result.rows[0].status !== 'Active') {
            res.status(401).json({ success: false, message: 'الحساب غير نشط أو غير موجود' });
            return;
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'رمز المصادقة غير صالح أو منتهي الصلاحية' });
    }
};
exports.authenticate = authenticate;
const authorize = (module, screen, action) => {
    return async (req, res, next) => {
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
            const result = await (0, db_1.query)(`SELECT ${column} FROM permissions 
         WHERE role_id = $1 AND module_name = $2 AND screen_name = $3`, [req.user.roleId, module, screen]);
            if (result.rows.length === 0 || !result.rows[0][column]) {
                res.status(403).json({
                    success: false,
                    message: 'ليس لديك صلاحية للوصول إلى هذا القسم'
                });
                return;
            }
            next();
        }
        catch (error) {
            res.status(500).json({ success: false, message: 'خطأ في التحقق من الصلاحيات' });
        }
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.js.map