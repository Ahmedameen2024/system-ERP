"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBankAccount = exports.updateBankAccount = exports.createBankAccount = exports.getBankAccountById = exports.getBankAccounts = exports.deleteCashBox = exports.updateCashBox = exports.createCashBox = exports.getCashBoxById = exports.getCashBoxes = void 0;
const db_1 = require("../config/db");
const response_1 = require("../utils/response");
// Helper to record audit log
const logAudit = async (userId, actionType, tableName, recordId, oldValues, newValues, req, description) => {
    try {
        const ipAddress = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || 'Unknown Device';
        await (0, db_1.query)(`INSERT INTO audit_logs (user_id, action_type, table_name, record_id, old_values, new_values, ip_address, user_agent, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
            userId,
            actionType,
            tableName,
            recordId,
            oldValues ? JSON.stringify(oldValues) : null,
            newValues ? JSON.stringify(newValues) : null,
            ipAddress,
            userAgent,
            description,
        ]);
    }
    catch (err) {
        console.error('Failed to log audit entry:', err);
    }
};
// ==========================================
// CASH BOXES MASTER CONTROLLER
// ==========================================
const getCashBoxes = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { search, branchId, status, page = 1, limit = 50 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const params = [companyId];
        let queryText = `
      SELECT cb.*,
             b.name_ar AS branch_name_ar, b.name_en AS branch_name_en,
             c.code AS currency_code, c.name_ar AS currency_name, c.symbol AS currency_symbol,
             gl.code AS gl_account_code, gl.name_ar AS gl_account_name,
             u.name_ar AS responsible_employee_name
      FROM cash_boxes cb
      LEFT JOIN branches b ON cb.branch_id = b.id
      LEFT JOIN currencies c ON cb.currency_id = c.id
      LEFT JOIN gl_accounts gl ON cb.gl_account_id = gl.id
      LEFT JOIN users u ON cb.responsible_employee_id = u.id
      WHERE cb.company_id = $1 AND cb.is_deleted = FALSE
    `;
        if (search) {
            params.push(`%${search}%`);
            queryText += ` AND (cb.code ILIKE $${params.length} OR cb.name_ar ILIKE $${params.length} OR cb.name_en ILIKE $${params.length})`;
        }
        if (branchId) {
            params.push(branchId);
            queryText += ` AND cb.branch_id = $${params.length}`;
        }
        if (status) {
            params.push(status);
            queryText += ` AND cb.status = $${params.length}`;
        }
        const countResult = await (0, db_1.query)(`SELECT COUNT(*) FROM (${queryText}) AS total`, params);
        const totalItems = parseInt(countResult.rows[0]?.count || '0', 10);
        queryText += ` ORDER BY cb.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(Number(limit), offset);
        const result = await (0, db_1.query)(queryText, params);
        (0, response_1.successResponse)(res, {
            items: result.rows,
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / Number(limit)) || 1,
                currentPage: Number(page),
                limit: Number(limit),
            },
        });
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في جلب الصناديق المالية', 500, error.message);
    }
};
exports.getCashBoxes = getCashBoxes;
const getCashBoxById = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const result = await (0, db_1.query)(`SELECT cb.*,
              b.name_ar AS branch_name_ar, c.code AS currency_code, gl.code AS gl_account_code, gl.name_ar AS gl_account_name
       FROM cash_boxes cb
       LEFT JOIN branches b ON cb.branch_id = b.id
       LEFT JOIN currencies c ON cb.currency_id = c.id
       LEFT JOIN gl_accounts gl ON cb.gl_account_id = gl.id
       WHERE cb.id = $1 AND cb.company_id = $2 AND cb.is_deleted = FALSE`, [id, companyId]);
        if (result.rows.length === 0) {
            (0, response_1.errorResponse)(res, 'الصندوق غير موجود', 404);
            return;
        }
        (0, response_1.successResponse)(res, result.rows[0]);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في جلب تفاصيل الصندوق', 500, error.message);
    }
};
exports.getCashBoxById = getCashBoxById;
const createCashBox = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.userId;
        const { code, nameAr, nameEn, branchId, currencyId, glAccountId, responsibleEmployeeId, openingBalance = 0, maximumBalance = 0, status = 'Active', notes, } = req.body;
        if (!code || !nameAr || !branchId || !currencyId || !glAccountId) {
            (0, response_1.errorResponse)(res, 'جميع الحقول الأساسية مطلوبة (كود الصندوق، الاسم العربي، الفرع، العملة، الحساب المحاسبي)', 400);
            return;
        }
        const existing = await (0, db_1.query)(`SELECT id FROM cash_boxes WHERE company_id = $1 AND code = $2 AND is_deleted = FALSE`, [companyId, code]);
        if (existing.rows.length > 0) {
            (0, response_1.errorResponse)(res, 'كود الصندوق مستخدم مسبقاً', 409);
            return;
        }
        const currentBalance = Number(openingBalance) || 0;
        const result = await (0, db_1.query)(`INSERT INTO cash_boxes (
        company_id, branch_id, code, name_ar, name_en, currency_id, gl_account_id,
        responsible_employee_id, opening_balance, current_balance, maximum_balance,
        status, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`, [
            companyId,
            branchId,
            code,
            nameAr,
            nameEn || nameAr,
            currencyId,
            glAccountId,
            responsibleEmployeeId || null,
            Number(openingBalance) || 0,
            currentBalance,
            Number(maximumBalance) || 0,
            status,
            notes || null,
            userId,
        ]);
        const createdBox = result.rows[0];
        await logAudit(userId, 'INSERT', 'cash_boxes', createdBox.id, null, createdBox, req, `إنشاء صندوق مالي جديد: ${nameAr} (${code})`);
        (0, response_1.successResponse)(res, createdBox, 'تم إنشاء الصندوق المالي بنجاح', 201);
    }
    catch (error) {
        if (error.code === '23505') {
            (0, response_1.errorResponse)(res, 'كود الصندوق مستخدم مسبقاً', 409);
        }
        else {
            (0, response_1.errorResponse)(res, 'خطأ في إضافة الصندوق المالي', 500, error.message);
        }
    }
};
exports.createCashBox = createCashBox;
const updateCashBox = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const userId = req.user.userId;
        const { code, nameAr, nameEn, branchId, currencyId, glAccountId, responsibleEmployeeId, openingBalance, maximumBalance, status, notes, } = req.body;
        const existing = await (0, db_1.query)(`SELECT * FROM cash_boxes WHERE id = $1 AND company_id = $2 AND is_deleted = FALSE`, [id, companyId]);
        if (existing.rows.length === 0) {
            (0, response_1.errorResponse)(res, 'الصندوق غير موجود', 404);
            return;
        }
        const oldValues = existing.rows[0];
        if (code && code !== oldValues.code) {
            const codeCheck = await (0, db_1.query)(`SELECT id FROM cash_boxes WHERE company_id = $1 AND code = $2 AND id != $3 AND is_deleted = FALSE`, [companyId, code, id]);
            if (codeCheck.rows.length > 0) {
                (0, response_1.errorResponse)(res, 'كود الصندوق مستخدم مسبقاً', 409);
                return;
            }
        }
        const result = await (0, db_1.query)(`UPDATE cash_boxes SET
        code = COALESCE($1, code),
        name_ar = COALESCE($2, name_ar),
        name_en = COALESCE($3, name_en),
        branch_id = COALESCE($4, branch_id),
        currency_id = COALESCE($5, currency_id),
        gl_account_id = COALESCE($6, gl_account_id),
        responsible_employee_id = $7,
        opening_balance = COALESCE($8, opening_balance),
        maximum_balance = COALESCE($9, maximum_balance),
        status = COALESCE($10, status),
        notes = COALESCE($11, notes),
        updated_at = NOW()
       WHERE id = $12 AND company_id = $13
       RETURNING *`, [
            code,
            nameAr,
            nameEn,
            branchId,
            currencyId,
            glAccountId,
            responsibleEmployeeId || null,
            openingBalance !== undefined ? Number(openingBalance) : null,
            maximumBalance !== undefined ? Number(maximumBalance) : null,
            status,
            notes,
            id,
            companyId,
        ]);
        const updatedBox = result.rows[0];
        await logAudit(userId, 'UPDATE', 'cash_boxes', updatedBox.id, oldValues, updatedBox, req, `تحديث بيانات الصندوق المالي: ${updatedBox.name_ar}`);
        (0, response_1.successResponse)(res, updatedBox, 'تم تحديث بيانات الصندوق بنجاح');
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في تحديث الصندوق المالي', 500, error.message);
    }
};
exports.updateCashBox = updateCashBox;
const deleteCashBox = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const userId = req.user.userId;
        const existing = await (0, db_1.query)(`SELECT * FROM cash_boxes WHERE id = $1 AND company_id = $2 AND is_deleted = FALSE`, [id, companyId]);
        if (existing.rows.length === 0) {
            (0, response_1.errorResponse)(res, 'الصندوق غير موجود', 404);
            return;
        }
        const rvCheck = await (0, db_1.query)(`SELECT id FROM receipt_vouchers WHERE cash_box_id = $1 LIMIT 1`, [id]);
        const pvCheck = await (0, db_1.query)(`SELECT id FROM payment_vouchers WHERE cash_box_id = $1 LIMIT 1`, [id]);
        const jlCheck = await (0, db_1.query)(`SELECT id FROM journal_entry_lines WHERE cash_box_id = $1 LIMIT 1`, [id]);
        if (rvCheck.rows.length > 0 || pvCheck.rows.length > 0 || jlCheck.rows.length > 0) {
            (0, response_1.errorResponse)(res, 'لا يمكن حذف الصندوق لارتباطه بمعاملات مالية سابقة', 400);
            return;
        }
        await (0, db_1.query)(`UPDATE cash_boxes SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND company_id = $2`, [id, companyId]);
        await logAudit(userId, 'DELETE', 'cash_boxes', id, existing.rows[0], null, req, `حذف الصندوق المالي: ${existing.rows[0].name_ar}`);
        (0, response_1.successResponse)(res, null, 'تم حذف الصندوق بنجاح');
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في حذف الصندوق المالي', 500, error.message);
    }
};
exports.deleteCashBox = deleteCashBox;
// ==========================================
// BANK ACCOUNTS MASTER CONTROLLER
// ==========================================
const getBankAccounts = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { search, branchId, status, page = 1, limit = 50 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const params = [companyId];
        let queryText = `
      SELECT ba.*,
             b.name_ar AS branch_name_ar, b.name_en AS branch_name_en,
             c.code AS currency_code, c.name_ar AS currency_name, c.symbol AS currency_symbol,
             gl.code AS gl_account_code, gl.name_ar AS gl_account_name
      FROM bank_accounts ba
      LEFT JOIN branches b ON ba.branch_id = b.id
      LEFT JOIN currencies c ON ba.currency_id = c.id
      LEFT JOIN gl_accounts gl ON ba.gl_account_id = gl.id
      WHERE ba.company_id = $1 AND ba.is_deleted = FALSE
    `;
        if (search) {
            params.push(`%${search}%`);
            queryText += ` AND (ba.code ILIKE $${params.length} OR ba.name_ar ILIKE $${params.length} OR ba.name_en ILIKE $${params.length} OR ba.account_number ILIKE $${params.length} OR ba.iban ILIKE $${params.length})`;
        }
        if (branchId) {
            params.push(branchId);
            queryText += ` AND ba.branch_id = $${params.length}`;
        }
        if (status) {
            params.push(status);
            queryText += ` AND ba.status = $${params.length}`;
        }
        const countResult = await (0, db_1.query)(`SELECT COUNT(*) FROM (${queryText}) AS total`, params);
        const totalItems = parseInt(countResult.rows[0]?.count || '0', 10);
        queryText += ` ORDER BY ba.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(Number(limit), offset);
        const result = await (0, db_1.query)(queryText, params);
        (0, response_1.successResponse)(res, {
            items: result.rows,
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / Number(limit)) || 1,
                currentPage: Number(page),
                limit: Number(limit),
            },
        });
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في جلب الحسابات البنكية', 500, error.message);
    }
};
exports.getBankAccounts = getBankAccounts;
const getBankAccountById = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const result = await (0, db_1.query)(`SELECT ba.*,
              b.name_ar AS branch_name_ar, c.code AS currency_code, gl.code AS gl_account_code, gl.name_ar AS gl_account_name
       FROM bank_accounts ba
       LEFT JOIN branches b ON ba.branch_id = b.id
       LEFT JOIN currencies c ON ba.currency_id = c.id
       LEFT JOIN gl_accounts gl ON ba.gl_account_id = gl.id
       WHERE ba.id = $1 AND ba.company_id = $2 AND ba.is_deleted = FALSE`, [id, companyId]);
        if (result.rows.length === 0) {
            (0, response_1.errorResponse)(res, 'الحساب البنكي غير موجود', 404);
            return;
        }
        (0, response_1.successResponse)(res, result.rows[0]);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في جلب تفاصيل الحساب البنكي', 500, error.message);
    }
};
exports.getBankAccountById = getBankAccountById;
const createBankAccount = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const userId = req.user.userId;
        const { code, nameAr, nameEn, branchId, currencyId, glAccountId, accountNumber, iban, swift, contactPerson, phone, email, openingBalance = 0, status = 'Active', notes, } = req.body;
        if (!code || !nameAr || !branchId || !currencyId || !glAccountId || !accountNumber) {
            (0, response_1.errorResponse)(res, 'جميع الحقول الأساسية مطلوبة (كود البنك، اسم البنك العربي، الفرع، العملة، الحساب المحاسبي، رقم الحساب)', 400);
            return;
        }
        const codeCheck = await (0, db_1.query)(`SELECT id FROM bank_accounts WHERE company_id = $1 AND code = $2 AND is_deleted = FALSE`, [companyId, code]);
        if (codeCheck.rows.length > 0) {
            (0, response_1.errorResponse)(res, 'كود الحساب البنكي مستخدم مسبقاً', 409);
            return;
        }
        const accCheck = await (0, db_1.query)(`SELECT id FROM bank_accounts WHERE company_id = $1 AND account_number = $2 AND is_deleted = FALSE`, [companyId, accountNumber]);
        if (accCheck.rows.length > 0) {
            (0, response_1.errorResponse)(res, 'رقم الحساب البنكي مستخدم مسبقاً', 409);
            return;
        }
        const currentBalance = Number(openingBalance) || 0;
        const result = await (0, db_1.query)(`INSERT INTO bank_accounts (
        company_id, branch_id, code, name_ar, name_en, currency_id, gl_account_id,
        account_number, iban, swift, contact_person, phone, email, opening_balance, current_balance,
        status, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`, [
            companyId,
            branchId,
            code,
            nameAr,
            nameEn || nameAr,
            currencyId,
            glAccountId,
            accountNumber,
            iban || null,
            swift || null,
            contactPerson || null,
            phone || null,
            email || null,
            Number(openingBalance) || 0,
            currentBalance,
            status,
            notes || null,
            userId,
        ]);
        const createdBank = result.rows[0];
        await logAudit(userId, 'INSERT', 'bank_accounts', createdBank.id, null, createdBank, req, `إنشاء حساب بنكي جديد: ${nameAr} (${accountNumber})`);
        (0, response_1.successResponse)(res, createdBank, 'تم إضافة الحساب البنكي بنجاح', 201);
    }
    catch (error) {
        if (error.code === '23505') {
            (0, response_1.errorResponse)(res, 'كود أو رقم الحساب البنكي مستخدم مسبقاً', 409);
        }
        else {
            (0, response_1.errorResponse)(res, 'خطأ في إضافة الحساب البنكي', 500, error.message);
        }
    }
};
exports.createBankAccount = createBankAccount;
const updateBankAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const userId = req.user.userId;
        const { code, nameAr, nameEn, branchId, currencyId, glAccountId, accountNumber, iban, swift, contactPerson, phone, email, openingBalance, status, notes, } = req.body;
        const existing = await (0, db_1.query)(`SELECT * FROM bank_accounts WHERE id = $1 AND company_id = $2 AND is_deleted = FALSE`, [id, companyId]);
        if (existing.rows.length === 0) {
            (0, response_1.errorResponse)(res, 'الحساب البنكي غير موجود', 404);
            return;
        }
        const oldValues = existing.rows[0];
        if (code && code !== oldValues.code) {
            const codeCheck = await (0, db_1.query)(`SELECT id FROM bank_accounts WHERE company_id = $1 AND code = $2 AND id != $3 AND is_deleted = FALSE`, [companyId, code, id]);
            if (codeCheck.rows.length > 0) {
                (0, response_1.errorResponse)(res, 'كود الحساب البنكي مستخدم مسبقاً', 409);
                return;
            }
        }
        if (accountNumber && accountNumber !== oldValues.account_number) {
            const accCheck = await (0, db_1.query)(`SELECT id FROM bank_accounts WHERE company_id = $1 AND account_number = $2 AND id != $3 AND is_deleted = FALSE`, [companyId, accountNumber, id]);
            if (accCheck.rows.length > 0) {
                (0, response_1.errorResponse)(res, 'رقم الحساب البنكي مستخدم مسبقاً', 409);
                return;
            }
        }
        const result = await (0, db_1.query)(`UPDATE bank_accounts SET
        code = COALESCE($1, code),
        name_ar = COALESCE($2, name_ar),
        name_en = COALESCE($3, name_en),
        branch_id = COALESCE($4, branch_id),
        currency_id = COALESCE($5, currency_id),
        gl_account_id = COALESCE($6, gl_account_id),
        account_number = COALESCE($7, account_number),
        iban = COALESCE($8, iban),
        swift = COALESCE($9, swift),
        contact_person = COALESCE($10, contact_person),
        phone = COALESCE($11, phone),
        email = COALESCE($12, email),
        opening_balance = COALESCE($13, opening_balance),
        status = COALESCE($14, status),
        notes = COALESCE($15, notes),
        updated_at = NOW()
       WHERE id = $16 AND company_id = $17
       RETURNING *`, [
            code,
            nameAr,
            nameEn,
            branchId,
            currencyId,
            glAccountId,
            accountNumber,
            iban,
            swift,
            contactPerson,
            phone,
            email,
            openingBalance !== undefined ? Number(openingBalance) : null,
            status,
            notes,
            id,
            companyId,
        ]);
        const updatedBank = result.rows[0];
        await logAudit(userId, 'UPDATE', 'bank_accounts', updatedBank.id, oldValues, updatedBank, req, `تحديث بيانات الحساب البنكي: ${updatedBank.name_ar}`);
        (0, response_1.successResponse)(res, updatedBank, 'تم تحديث بيانات الحساب البنكي بنجاح');
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في تحديث الحساب البنكي', 500, error.message);
    }
};
exports.updateBankAccount = updateBankAccount;
const deleteBankAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const userId = req.user.userId;
        const existing = await (0, db_1.query)(`SELECT * FROM bank_accounts WHERE id = $1 AND company_id = $2 AND is_deleted = FALSE`, [id, companyId]);
        if (existing.rows.length === 0) {
            (0, response_1.errorResponse)(res, 'الحساب البنكي غير موجود', 404);
            return;
        }
        const rvCheck = await (0, db_1.query)(`SELECT id FROM receipt_vouchers WHERE bank_account_id = $1 LIMIT 1`, [id]);
        const pvCheck = await (0, db_1.query)(`SELECT id FROM payment_vouchers WHERE bank_account_id = $1 LIMIT 1`, [id]);
        const jlCheck = await (0, db_1.query)(`SELECT id FROM journal_entry_lines WHERE bank_account_id = $1 LIMIT 1`, [id]);
        if (rvCheck.rows.length > 0 || pvCheck.rows.length > 0 || jlCheck.rows.length > 0) {
            (0, response_1.errorResponse)(res, 'لا يمكن حذف الحساب البنكي لارتباطه بمعاملات مالية سابقة', 400);
            return;
        }
        await (0, db_1.query)(`UPDATE bank_accounts SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND company_id = $2`, [id, companyId]);
        await logAudit(userId, 'DELETE', 'bank_accounts', id, existing.rows[0], null, req, `حذف الحساب البنكي: ${existing.rows[0].name_ar}`);
        (0, response_1.successResponse)(res, null, 'تم حذف الحساب البنكي بنجاح');
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في حذف الحساب البنكي', 500, error.message);
    }
};
exports.deleteBankAccount = deleteBankAccount;
//# sourceMappingURL=cashBanksController.js.map