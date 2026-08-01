"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.auditLog = void 0;
const db_1 = require("../config/db");
const auditLog = (tableName, actionType) => {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            if (req.user && res.statusCode < 400) {
                // Fire-and-forget audit log
                const recordId = req.params.id || data?.data?.id;
                (0, db_1.query)(`INSERT INTO audit_logs (user_id, action_type, table_name, record_id, new_values, ip_address, user_agent, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
                    req.user.userId,
                    actionType,
                    tableName,
                    recordId || null,
                    JSON.stringify(req.body),
                    req.ip,
                    req.headers['user-agent'] || '',
                    `${req.method} ${req.path}`,
                ]).catch(err => console.error('Audit log error:', err));
            }
            return originalJson(data);
        };
        next();
    };
};
exports.auditLog = auditLog;
const errorHandler = (err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'حدث خطأ داخلي في الخادم',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=audit.js.map