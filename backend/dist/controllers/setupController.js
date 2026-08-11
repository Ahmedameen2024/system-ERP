"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinancialPeriods = exports.updateSupplier = exports.createSupplier = exports.getSuppliers = exports.createDepartment = exports.getDepartments = exports.getTaxes = exports.getPaymentMethods = exports.updateSettings = exports.getSettings = exports.updatePermissions = exports.getPermissions = exports.createRole = exports.getRoles = exports.updateUser = exports.createUser = exports.getUsers = exports.createExchangeRate = exports.getExchangeRates = exports.updateCurrency = exports.createCurrency = exports.getCurrencies = exports.deleteBranch = exports.updateBranch = exports.createBranch = exports.getBranches = exports.updateCompany = exports.getCompany = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const response_1 = require("../utils/response");
// ========== COMPANIES ==========
const getCompany = async (req, res) => {
    try {
        const result = await (0, db_1.query)(`SELECT c.*, cur.code as currency_code, cur.name_ar as currency_name
       FROM companies c LEFT JOIN currencies cur ON cur.id = c.base_currency_id
       WHERE c.id = $1`, [req.user.companyId]);
        (0, response_1.successResponse)(res, result.rows[0] || null);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في جلب بيانات الشركة', 500);
    }
};
exports.getCompany = getCompany;
const updateCompany = async (req, res) => {
    try {
        const { nameAr, nameEn, logoPath, activity, taxNumber, crNumber, phone, email, website, address, country, city, baseCurrencyId, fiscalYearStart, fiscalYearEnd } = req.body;
        const result = await (0, db_1.query)(`UPDATE companies SET name_ar=$1, name_en=$2, logo_path=$3, activity=$4, tax_number=$5,
       cr_number=$6, phone=$7, email=$8, website=$9, address=$10, country=$11, city=$12,
       base_currency_id=$13, fiscal_year_start=$14, fiscal_year_end=$15, updated_at=NOW()
       WHERE id=$16 RETURNING *`, [nameAr, nameEn, logoPath, activity, taxNumber, crNumber, phone, email, website, address, country, city, baseCurrencyId, fiscalYearStart, fiscalYearEnd, req.user.companyId]);
        (0, response_1.successResponse)(res, result.rows[0], 'تم تحديث بيانات الشركة بنجاح');
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في تحديث بيانات الشركة', 500);
    }
};
exports.updateCompany = updateCompany;
// ========== BRANCHES ==========
const getBranches = async (req, res) => {
    try {
        const { page, limit, offset } = (0, response_1.getPaginationParams)(req.query);
        const search = req.query.search || '';
        const countResult = await (0, db_1.query)(`SELECT COUNT(*) FROM branches WHERE company_id=$1 AND (name_ar ILIKE $2 OR name_en ILIKE $2 OR code ILIKE $2)`, [req.user.companyId, `%${search}%`]);
        const total = parseInt(countResult.rows[0].count);
        const result = await (0, db_1.query)(`SELECT b.*, u.name_ar as manager_name FROM branches b
       LEFT JOIN users u ON u.id = b.manager_id
       WHERE b.company_id=$1 AND (b.name_ar ILIKE $2 OR b.name_en ILIKE $2 OR b.code ILIKE $2)
       ORDER BY b.created_at DESC LIMIT $3 OFFSET $4`, [req.user.companyId, `%${search}%`, limit, offset]);
        (0, response_1.paginatedResponse)(res, result.rows, total, page, limit);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في جلب الفروع', 500);
    }
};
exports.getBranches = getBranches;
const createBranch = async (req, res) => {
    try {
        const { code, nameAr, nameEn, managerId, city, address, phone, email } = req.body;
        const result = await (0, db_1.query)(`INSERT INTO branches (company_id, code, name_ar, name_en, manager_id, city, address, phone, email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [req.user.companyId, code, nameAr, nameEn, managerId || null, city, address, phone, email]);
        (0, response_1.successResponse)(res, result.rows[0], 'تم إضافة الفرع بنجاح', 201);
    }
    catch (error) {
        if (error.code === '23505') {
            (0, response_1.errorResponse)(res, 'كود الفرع مستخدم مسبقاً', 409);
        }
        else {
            (0, response_1.errorResponse)(res, 'خطأ في إضافة الفرع', 500);
        }
    }
};
exports.createBranch = createBranch;
const updateBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, nameAr, nameEn, managerId, city, address, phone, email, status } = req.body;
        const result = await (0, db_1.query)(`UPDATE branches SET code=$1,name_ar=$2,name_en=$3,manager_id=$4,city=$5,address=$6,
       phone=$7,email=$8,status=$9,updated_at=NOW() WHERE id=$10 AND company_id=$11 RETURNING *`, [code, nameAr, nameEn, managerId || null, city, address, phone, email, status, id, req.user.companyId]);
        if (result.rows.length === 0) {
            (0, response_1.errorResponse)(res, 'الفرع غير موجود', 404);
            return;
        }
        (0, response_1.successResponse)(res, result.rows[0], 'تم تحديث الفرع بنجاح');
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في تحديث الفرع', 500);
    }
};
exports.updateBranch = updateBranch;
const deleteBranch = async (req, res) => {
    try {
        const { id } = req.params;
        await (0, db_1.query)('UPDATE branches SET status=$1 WHERE id=$2 AND company_id=$3', ['Inactive', id, req.user.companyId]);
        (0, response_1.successResponse)(res, null, 'تم إلغاء تفعيل الفرع بنجاح');
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في حذف الفرع', 500);
    }
};
exports.deleteBranch = deleteBranch;
// ========== CURRENCIES ==========
const getCurrencies = async (req, res) => {
    try {
        const result = await (0, db_1.query)('SELECT * FROM currencies WHERE status=$1 ORDER BY is_default DESC, code ASC', ['Active']);
        (0, response_1.successResponse)(res, result.rows);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في جلب العملات', 500);
    }
};
exports.getCurrencies = getCurrencies;
const createCurrency = async (req, res) => {
    try {
        const { code, nameAr, nameEn, symbol, decimalPlaces, isDefault } = req.body;
        await (0, db_1.transaction)(async (client) => {
            if (isDefault)
                await client.query('UPDATE currencies SET is_default=FALSE');
            const result = await client.query(`INSERT INTO currencies (code, name_ar, name_en, symbol, decimal_places, is_default)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [code, nameAr, nameEn, symbol, decimalPlaces || 2, isDefault || false]);
            (0, response_1.successResponse)(res, result.rows[0], 'تم إضافة العملة بنجاح', 201);
        });
    }
    catch (error) {
        if (error.code === '23505') {
            (0, response_1.errorResponse)(res, 'كود العملة مستخدم مسبقاً', 409);
        }
        else {
            (0, response_1.errorResponse)(res, 'خطأ في إضافة العملة', 500);
        }
    }
};
exports.createCurrency = createCurrency;
const updateCurrency = async (req, res) => {
    try {
        const { id } = req.params;
        const { nameAr, nameEn, symbol, decimalPlaces, isDefault, status } = req.body;
        await (0, db_1.transaction)(async (client) => {
            if (isDefault)
                await client.query('UPDATE currencies SET is_default=FALSE WHERE id != $1', [id]);
            const result = await client.query(`UPDATE currencies SET name_ar=$1,name_en=$2,symbol=$3,decimal_places=$4,is_default=$5,status=$6
         WHERE id=$7 RETURNING *`, [nameAr, nameEn, symbol, decimalPlaces, isDefault, status, id]);
            if (result.rows.length === 0) {
                (0, response_1.errorResponse)(res, 'العملة غير موجودة', 404);
                return;
            }
            (0, response_1.successResponse)(res, result.rows[0], 'تم تحديث العملة بنجاح');
        });
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في تحديث العملة', 500);
    }
};
exports.updateCurrency = updateCurrency;
// ========== EXCHANGE RATES ==========
const getExchangeRates = async (req, res) => {
    try {
        const { currencyId, fromDate, toDate } = req.query;
        let sql = `SELECT er.*, c.code as currency_code, c.name_ar as currency_name, c.symbol
               FROM exchange_rates er JOIN currencies c ON c.id = er.currency_id
               WHERE er.company_id=$1`;
        const params = [req.user.companyId];
        if (currencyId) {
            sql += ` AND er.currency_id=$${params.length + 1}`;
            params.push(currencyId);
        }
        if (fromDate) {
            sql += ` AND er.rate_date >= $${params.length + 1}`;
            params.push(fromDate);
        }
        if (toDate) {
            sql += ` AND er.rate_date <= $${params.length + 1}`;
            params.push(toDate);
        }
        sql += ' ORDER BY er.rate_date DESC LIMIT 100';
        const result = await (0, db_1.query)(sql, params);
        (0, response_1.successResponse)(res, result.rows);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في جلب أسعار الصرف', 500);
    }
};
exports.getExchangeRates = getExchangeRates;
const createExchangeRate = async (req, res) => {
    try {
        const { currencyId, rateDate, buyRate, sellRate, midRate } = req.body;
        const result = await (0, db_1.query)(`INSERT INTO exchange_rates (company_id, currency_id, rate_date, buy_rate, sell_rate, mid_rate, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (currency_id, rate_date) DO UPDATE
       SET buy_rate=$4, sell_rate=$5, mid_rate=$6, created_by=$7 RETURNING *`, [req.user.companyId, currencyId, rateDate, buyRate, sellRate, midRate, req.user.userId]);
        (0, response_1.successResponse)(res, result.rows[0], 'تم حفظ سعر الصرف بنجاح', 201);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في حفظ سعر الصرف', 500);
    }
};
exports.createExchangeRate = createExchangeRate;
// ========== USERS ==========
const getUsers = async (req, res) => {
    try {
        const { page, limit, offset } = (0, response_1.getPaginationParams)(req.query);
        const search = req.query.search || '';
        const countResult = await (0, db_1.query)(`SELECT COUNT(*) FROM users WHERE company_id=$1 AND (username ILIKE $2 OR name_ar ILIKE $2 OR email ILIKE $2)`, [req.user.companyId, `%${search}%`]);
        const total = parseInt(countResult.rows[0].count);
        const result = await (0, db_1.query)(`SELECT u.id, u.username, u.name_ar, u.name_en, u.email, u.status, u.language,
              u.last_login, u.created_at, r.name_ar as role_name, b.name_ar as branch_name
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       LEFT JOIN branches b ON b.id = u.branch_id
       WHERE u.company_id=$1 AND (u.username ILIKE $2 OR u.name_ar ILIKE $2 OR u.email ILIKE $2)
       ORDER BY u.created_at DESC LIMIT $3 OFFSET $4`, [req.user.companyId, `%${search}%`, limit, offset]);
        (0, response_1.paginatedResponse)(res, result.rows, total, page, limit);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في جلب المستخدمين', 500);
    }
};
exports.getUsers = getUsers;
const createUser = async (req, res) => {
    try {
        const { username, password, nameAr, nameEn, email, roleId, branchId, language } = req.body;
        if (!username || !password) {
            (0, response_1.errorResponse)(res, 'اسم المستخدم وكلمة المرور مطلوبان', 400);
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        const result = await (0, db_1.query)(`INSERT INTO users (username, password_hash, name_ar, name_en, email, role_id, company_id, branch_id, language)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, username, name_ar, name_en, email, status, created_at`, [username, passwordHash, nameAr, nameEn, email, roleId, req.user.companyId, branchId || null, language || 'ar']);
        (0, response_1.successResponse)(res, result.rows[0], 'تم إضافة المستخدم بنجاح', 201);
    }
    catch (error) {
        if (error.code === '23505') {
            (0, response_1.errorResponse)(res, 'اسم المستخدم أو البريد الإلكتروني مستخدم مسبقاً', 409);
        }
        else {
            (0, response_1.errorResponse)(res, 'خطأ في إضافة المستخدم', 500);
        }
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nameAr, nameEn, email, roleId, branchId, language, status, password } = req.body;
        let passwordHash;
        if (password)
            passwordHash = await bcryptjs_1.default.hash(password, 12);
        const result = await (0, db_1.query)(`UPDATE users SET name_ar=$1, name_en=$2, email=$3, role_id=$4, branch_id=$5, 
       language=$6, status=$7 ${passwordHash ? ', password_hash=$9' : ''}, updated_at=NOW()
       WHERE id=$8 AND company_id=${passwordHash ? '$10' : '$9'} RETURNING id, username, name_ar, status`, passwordHash
            ? [nameAr, nameEn, email, roleId, branchId || null, language, status, id, passwordHash, req.user.companyId]
            : [nameAr, nameEn, email, roleId, branchId || null, language, status, id, req.user.companyId]);
        if (result.rows.length === 0) {
            (0, response_1.errorResponse)(res, 'المستخدم غير موجود', 404);
            return;
        }
        (0, response_1.successResponse)(res, result.rows[0], 'تم تحديث المستخدم بنجاح');
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في تحديث المستخدم', 500);
    }
};
exports.updateUser = updateUser;
// ========== ROLES & PERMISSIONS ==========
const getRoles = async (req, res) => {
    try {
        const result = await (0, db_1.query)('SELECT * FROM roles WHERE company_id=$1 ORDER BY is_system_role DESC, name_ar', [req.user.companyId]);
        (0, response_1.successResponse)(res, result.rows);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في جلب الأدوار', 500);
    }
};
exports.getRoles = getRoles;
const createRole = async (req, res) => {
    try {
        const { nameAr, nameEn, description } = req.body;
        const result = await (0, db_1.query)(`INSERT INTO roles (company_id, name_ar, name_en, description) VALUES ($1,$2,$3,$4) RETURNING *`, [req.user.companyId, nameAr, nameEn, description]);
        (0, response_1.successResponse)(res, result.rows[0], 'تم إضافة الدور بنجاح', 201);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في إضافة الدور', 500);
    }
};
exports.createRole = createRole;
const getPermissions = async (req, res) => {
    try {
        const { roleId } = req.params;
        const result = await (0, db_1.query)('SELECT * FROM permissions WHERE role_id=$1 ORDER BY module_name, screen_name', [roleId]);
        (0, response_1.successResponse)(res, result.rows);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في جلب الصلاحيات', 500);
    }
};
exports.getPermissions = getPermissions;
const updatePermissions = async (req, res) => {
    try {
        const { roleId } = req.params;
        const { permissions } = req.body;
        await (0, db_1.transaction)(async (client) => {
            for (const perm of permissions) {
                await client.query(`INSERT INTO permissions (role_id, module_name, screen_name, can_view, can_create, can_edit, can_delete, can_approve, can_print, can_export)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           ON CONFLICT (role_id, module_name, screen_name) DO UPDATE
           SET can_view=$4, can_create=$5, can_edit=$6, can_delete=$7, can_approve=$8, can_print=$9, can_export=$10`, [roleId, perm.moduleName, perm.screenName, perm.canView, perm.canCreate, perm.canEdit, perm.canDelete, perm.canApprove, perm.canPrint, perm.canExport]);
            }
        });
        (0, response_1.successResponse)(res, null, 'تم تحديث الصلاحيات بنجاح');
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في تحديث الصلاحيات', 500);
    }
};
exports.updatePermissions = updatePermissions;
// ========== SYSTEM SETTINGS ==========
const getSettings = async (req, res) => {
    try {
        const result = await (0, db_1.query)('SELECT * FROM system_settings WHERE company_id=$1', [req.user.companyId]);
        const settings = {};
        result.rows.forEach(r => { settings[r.key] = r.value; });
        (0, response_1.successResponse)(res, settings);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في جلب الإعدادات', 500);
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        const settings = req.body;
        await (0, db_1.transaction)(async (client) => {
            for (const [key, value] of Object.entries(settings)) {
                await client.query(`INSERT INTO system_settings (company_id, key, value, updated_by)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (company_id, key) DO UPDATE SET value=$3, updated_by=$4, updated_at=NOW()`, [req.user.companyId, key, value, req.user.userId]);
            }
        });
        (0, response_1.successResponse)(res, null, 'تم تحديث الإعدادات بنجاح');
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في تحديث الإعدادات', 500);
    }
};
exports.updateSettings = updateSettings;
// ========== PAYMENT METHODS ==========
const getPaymentMethods = async (req, res) => {
    try {
        const result = await (0, db_1.query)('SELECT * FROM payment_methods WHERE company_id=$1 AND status=$2 ORDER BY name_ar', [req.user.companyId, 'Active']);
        (0, response_1.successResponse)(res, result.rows);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في جلب طرق الدفع', 500);
    }
};
exports.getPaymentMethods = getPaymentMethods;
// ========== TAXES ==========
const getTaxes = async (req, res) => {
    try {
        const result = await (0, db_1.query)('SELECT * FROM taxes WHERE company_id=$1 AND status=$2 ORDER BY name_ar', [req.user.companyId, 'Active']);
        (0, response_1.successResponse)(res, result.rows);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في جلب الضرائب', 500);
    }
};
exports.getTaxes = getTaxes;
// ========== DEPARTMENTS ==========
const getDepartments = async (req, res) => {
    try {
        const result = await (0, db_1.query)(`SELECT d.*, b.name_ar as branch_name FROM departments d
       LEFT JOIN branches b ON b.id = d.branch_id
       WHERE b.company_id=$1 AND d.status='Active' ORDER BY d.name_ar`, [req.user.companyId]);
        (0, response_1.successResponse)(res, result.rows);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في جلب الأقسام', 500);
    }
};
exports.getDepartments = getDepartments;
const createDepartment = async (req, res) => {
    try {
        const { code, nameAr, nameEn, branchId, managerId } = req.body;
        const result = await (0, db_1.query)(`INSERT INTO departments (code, name_ar, name_en, branch_id, manager_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [code, nameAr, nameEn, branchId, managerId || null]);
        (0, response_1.successResponse)(res, result.rows[0], 'تم إضافة القسم بنجاح', 201);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في إضافة القسم', 500);
    }
};
exports.createDepartment = createDepartment;
// ========== SUPPLIERS ==========
const getSuppliers = async (req, res) => {
    try {
        const result = await (0, db_1.query)(`SELECT s.*, cu.code AS currency_code, cu.name_ar AS currency_name FROM suppliers s
       LEFT JOIN currencies cu ON s.currency_id = cu.id
       WHERE s.company_id = $1 ORDER BY s.code`, [req.user.companyId]);
        (0, response_1.successResponse)(res, result.rows);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في جلب الموردين', 500);
    }
};
exports.getSuppliers = getSuppliers;
const createSupplier = async (req, res) => {
    try {
        const { code, nameAr, nameEn, contactPerson, phone, email, city, address, taxNumber, crNumber, creditLimit, openingBalance, currencyId, apAccountId, paymentTerms, status } = req.body;
        if (!currencyId) {
            (0, response_1.errorResponse)(res, 'العملة مطلوبة', 400);
            return;
        }
        if (!nameAr) {
            (0, response_1.errorResponse)(res, 'الاسم العربي مطلوب', 400);
            return;
        }
        // Auto-generate code if not provided
        let supplierCode = code;
        if (!supplierCode) {
            const countResult = await (0, db_1.query)(`SELECT COUNT(*) FROM suppliers WHERE company_id = $1`, [req.user.companyId]);
            const count = parseInt(countResult.rows[0].count) + 1;
            supplierCode = 'SUP-' + String(count).padStart(4, '0');
        }
        const creditLimitValue = (creditLimit !== undefined && creditLimit !== null && creditLimit !== '')
            ? parseFloat(creditLimit)
            : null;
        const result = await (0, db_1.query)(`INSERT INTO suppliers 
        (company_id, code, name_ar, name_en, contact_person, phone, email, city, address,
         tax_number, cr_number, credit_limit, currency_id,
         ap_account_id, payment_terms, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`, [
            req.user.companyId, supplierCode, nameAr, nameEn || null, contactPerson || null,
            phone || null, email || null, city || null, address || null,
            taxNumber || null, crNumber || null, creditLimitValue,
            currencyId || null, apAccountId || null, paymentTerms || 30, status || 'Active'
        ]);
        (0, response_1.successResponse)(res, result.rows[0], 'تم إضافة المورد بنجاح', 201);
    }
    catch (error) {
        if (error.code === '23505') {
            (0, response_1.errorResponse)(res, 'كود المورد موجود مسبقاً', 409);
        }
        else {
            (0, response_1.errorResponse)(res, 'خطأ في إضافة المورد', 500);
        }
    }
};
exports.createSupplier = createSupplier;
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { nameAr, nameEn, contactPerson, phone, email, city, address, taxNumber, crNumber, creditLimit, currencyId, apAccountId, paymentTerms, status } = req.body;
        const creditLimitValue = (creditLimit !== undefined && creditLimit !== null && creditLimit !== '')
            ? parseFloat(creditLimit)
            : null;
        const result = await (0, db_1.query)(`UPDATE suppliers SET
        name_ar=$1, name_en=$2, contact_person=$3, phone=$4, email=$5,
        city=$6, address=$7, tax_number=$8, cr_number=$9, credit_limit=$10,
        currency_id=$11, ap_account_id=$12, payment_terms=$13, status=$14
       WHERE id=$15 AND company_id=$16 RETURNING *`, [
            nameAr, nameEn || null, contactPerson || null, phone || null, email || null,
            city || null, address || null, taxNumber || null, crNumber || null, creditLimitValue,
            currencyId || null, apAccountId || null, paymentTerms || 30, status || 'Active',
            id, req.user.companyId
        ]);
        if (result.rows.length === 0) {
            (0, response_1.errorResponse)(res, 'المورد غير موجود', 404);
            return;
        }
        (0, response_1.successResponse)(res, result.rows[0], 'تم تحديث المورد بنجاح');
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في تحديث المورد', 500);
    }
};
exports.updateSupplier = updateSupplier;
// ========== FINANCIAL PERIODS ==========
const getFinancialPeriods = async (req, res) => {
    try {
        const result = await (0, db_1.query)(`SELECT * FROM financial_periods WHERE company_id = $1 ORDER BY start_date DESC`, [req.user.companyId]);
        (0, response_1.successResponse)(res, result.rows);
    }
    catch (error) {
        (0, response_1.errorResponse)(res, 'خطأ في جلب الفترات المالية', 500);
    }
};
exports.getFinancialPeriods = getFinancialPeriods;
//# sourceMappingURL=setupController.js.map