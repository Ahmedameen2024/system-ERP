import { Request, Response } from 'express';
import { query, transaction } from '../config/db';
import { successResponse, errorResponse } from '../utils/response';

// ========== GL ACCOUNTS ==========
export const getAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT * FROM gl_accounts WHERE company_id=$1 ORDER BY code`,
      [req.user!.companyId]
    );
    successResponse(res, result.rows);
  } catch (error) {
    errorResponse(res, 'خطأ في جلب دليل الحسابات', 500);
  }
};

export const createAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, nameAr, nameEn, accountType, nature, accountLevel, allowPosting, parentId, status } = req.body;
    const result = await query(
      `INSERT INTO gl_accounts (company_id, code, name_ar, name_en, account_type, nature, account_level, allow_posting, parent_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user!.companyId, code, nameAr, nameEn, accountType, nature, accountLevel || 1, allowPosting, parentId || null, status || 'Active']
    );
    successResponse(res, result.rows[0], 'تم إضافة الحساب بنجاح', 201);
  } catch (error: any) {
    if (error.code === '23505') {
      errorResponse(res, 'رقم الحساب مستخدم مسبقاً', 409);
    } else {
      errorResponse(res, 'خطأ في إضافة الحساب', 500);
    }
  }
};

export const updateAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { code, nameAr, nameEn, accountType, nature, accountLevel, allowPosting, parentId, status } = req.body;
    const result = await query(
      `UPDATE gl_accounts SET code=$1, name_ar=$2, name_en=$3, account_type=$4, nature=$5, 
       account_level=$6, allow_posting=$7, parent_id=$8, status=$9 
       WHERE id=$10 AND company_id=$11 RETURNING *`,
      [code, nameAr, nameEn, accountType, nature, accountLevel, allowPosting, parentId || null, status, id, req.user!.companyId]
    );
    if (result.rows.length === 0) {
      errorResponse(res, 'الحساب غير موجود', 404);
      return;
    }
    successResponse(res, result.rows[0], 'تم تحديث الحساب بنجاح');
  } catch (error) {
    errorResponse(res, 'خطأ في تحديث الحساب', 500);
  }
};

// ========== COST CENTERS ==========
export const getCostCenters = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT * FROM cost_centers WHERE company_id=$1 ORDER BY code`,
      [req.user!.companyId]
    );
    successResponse(res, result.rows);
  } catch (error) {
    errorResponse(res, 'خطأ في جلب مراكز التكلفة', 500);
  }
};

export const createCostCenter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, nameAr, nameEn, parentId, managerId, budget, status } = req.body;
    const result = await query(
      `INSERT INTO cost_centers (company_id, code, name_ar, name_en, parent_id, manager_id, budget, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user!.companyId, code, nameAr, nameEn, parentId || null, managerId || null, budget || 0, status || 'Active']
    );
    successResponse(res, result.rows[0], 'تم إضافة مركز التكلفة بنجاح', 201);
  } catch (error: any) {
    if (error.code === '23505') {
      errorResponse(res, 'رمز مركز التكلفة مستخدم مسبقاً', 409);
    } else {
      errorResponse(res, 'خطأ في إضافة مركز التكلفة', 500);
    }
  }
};

export const updateCostCenter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { code, nameAr, nameEn, parentId, managerId, budget, status } = req.body;
    const result = await query(
      `UPDATE cost_centers SET code=$1, name_ar=$2, name_en=$3, parent_id=$4, manager_id=$5, budget=$6, status=$7
       WHERE id=$8 AND company_id=$9 RETURNING *`,
      [code, nameAr, nameEn, parentId || null, managerId || null, budget, status, id, req.user!.companyId]
    );
    if (result.rows.length === 0) {
      errorResponse(res, 'مركز التكلفة غير موجود', 404);
      return;
    }
    successResponse(res, result.rows[0], 'تم تحديث مركز التكلفة بنجاح');
  } catch (error) {
    errorResponse(res, 'خطأ في تحديث مركز التكلفة', 500);
  }
};

// ========== JOURNAL ENTRIES ==========
export const getJournalEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT je.*, 
              b.name_ar AS branch_name,
              c.code AS currency_code, c.symbol AS currency_symbol,
              fp.name AS period_name,
              u.name_ar AS creator_name,
              app_u.name_ar AS approver_name,
              (
                SELECT json_agg(
                  json_build_object(
                    'id', jel.id,
                    'glAccountId', jel.gl_account_id,
                    'accountCode', acc.code,
                    'accountName', acc.name_ar,
                    'costCenterId', jel.cost_center_id,
                    'costCenterCode', cc.code,
                    'costCenterName', cc.name_ar,
                    'cashBoxId', jel.cash_box_id,
                    'bankAccountId', jel.bank_account_id,
                    'customerId', jel.customer_id,
                    'supplierId', jel.supplier_id,
                    'employeeId', jel.employee_id,
                    'projectId', jel.project_id,
                    'debit', jel.debit,
                    'credit', jel.credit,
                    'debitBase', jel.debit_base,
                    'creditBase', jel.credit_base,
                    'description', jel.line_description,
                    'sortOrder', jel.sort_order
                  ) ORDER BY jel.sort_order ASC, jel.id ASC
                ) FROM journal_entry_lines jel 
                LEFT JOIN gl_accounts acc ON acc.id = jel.gl_account_id
                LEFT JOIN cost_centers cc ON cc.id = jel.cost_center_id
                WHERE jel.journal_entry_id = je.id
              ) AS lines
       FROM journal_entries je
       LEFT JOIN branches b ON b.id = je.branch_id
       LEFT JOIN currencies c ON c.id = je.currency_id
       LEFT JOIN financial_periods fp ON fp.id = je.period_id
       LEFT JOIN users u ON u.id = je.created_by
       LEFT JOIN users app_u ON app_u.id = je.approved_by
       WHERE je.branch_id IN (SELECT id FROM branches WHERE company_id=$1) 
       ORDER BY je.entry_date DESC, je.created_at DESC LIMIT 200`,
      [req.user!.companyId]
    );
    successResponse(res, result.rows);
  } catch (error: any) {
    errorResponse(res, 'خطأ في جلب القيود اليومية', 500, error.message);
  }
};

export const getJournalEntryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT je.*, 
              b.name_ar AS branch_name,
              c.code AS currency_code, c.symbol AS currency_symbol,
              fp.name AS period_name,
              u.name_ar AS creator_name,
              app_u.name_ar AS approver_name,
              (
                SELECT json_agg(
                  json_build_object(
                    'id', jel.id,
                    'glAccountId', jel.gl_account_id,
                    'accountCode', acc.code,
                    'accountName', acc.name_ar,
                    'costCenterId', jel.cost_center_id,
                    'costCenterCode', cc.code,
                    'costCenterName', cc.name_ar,
                    'cashBoxId', jel.cash_box_id,
                    'bankAccountId', jel.bank_account_id,
                    'customerId', jel.customer_id,
                    'supplierId', jel.supplier_id,
                    'employeeId', jel.employee_id,
                    'projectId', jel.project_id,
                    'debit', jel.debit,
                    'credit', jel.credit,
                    'debitBase', jel.debit_base,
                    'creditBase', jel.credit_base,
                    'description', jel.line_description,
                    'sortOrder', jel.sort_order
                  ) ORDER BY jel.sort_order ASC, jel.id ASC
                ) FROM journal_entry_lines jel 
                LEFT JOIN gl_accounts acc ON acc.id = jel.gl_account_id
                LEFT JOIN cost_centers cc ON cc.id = jel.cost_center_id
                WHERE jel.journal_entry_id = je.id
              ) AS lines
       FROM journal_entries je
       LEFT JOIN branches b ON b.id = je.branch_id
       LEFT JOIN currencies c ON c.id = je.currency_id
       LEFT JOIN financial_periods fp ON fp.id = je.period_id
       LEFT JOIN users u ON u.id = je.created_by
       LEFT JOIN users app_u ON app_u.id = je.approved_by
       WHERE je.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      errorResponse(res, 'القيد اليومي غير موجود', 404);
      return;
    }

    const auditRes = await query(
      `SELECT al.*, u.name_ar AS user_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.table_name = 'journal_entries' AND al.record_id = $1
       ORDER BY al.timestamp DESC`,
      [id]
    );

    const entryData = {
      ...result.rows[0],
      audit_logs: auditRes.rows,
    };

    successResponse(res, entryData);
  } catch (error: any) {
    errorResponse(res, 'خطأ في جلب تفاصيل القيد', 500, error.message);
  }
};

export const createJournalEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      entryDate,
      periodId,
      description,
      referenceNo,
      referenceType = 'GeneralJournal',
      branchId,
      currencyId,
      exchangeRate = 1,
      status = 'Draft',
      lines = []
    } = req.body;

    if (!lines || lines.length === 0) {
      errorResponse(res, 'يجب إضافة سطر واحد على الأقل في القيد', 400);
      return;
    }

    if (periodId) {
      const periodRes = await query(`SELECT is_closed FROM financial_periods WHERE id = $1`, [periodId]);
      if (periodRes.rows.length > 0 && periodRes.rows[0].is_closed) {
        errorResponse(res, 'الفترة المالية المختارة مغلقة ولا يمكن التحديث أو التمكين فيها', 400);
        return;
      }
    }

    const rate = Number(exchangeRate) || 1;
    let totalDebitLocal = 0;
    let totalCreditLocal = 0;

    for (const line of lines) {
      if (!line.glAccountId) {
        errorResponse(res, 'جميع السطور يجب أن تحتوي على حساب محاسبي صالح', 400);
        return;
      }

      const accRes = await query(`SELECT allow_posting, status FROM gl_accounts WHERE id = $1`, [line.glAccountId]);
      if (accRes.rows.length === 0) {
        errorResponse(res, 'أحد الحسابات غير موجود بالنظام', 400);
        return;
      }
      if (accRes.rows[0].status !== 'Active') {
        errorResponse(res, 'أحد الحسابات غير نشط (موقوف)', 400);
        return;
      }
      if (!accRes.rows[0].allow_posting) {
        errorResponse(res, 'أحد الحسابات غير قابل للترحيل المباشر (حساب رئيسي)', 400);
        return;
      }

      const dBase = line.debitBase !== undefined ? Number(line.debitBase) : (Number(line.debit) || 0) * rate;
      const cBase = line.creditBase !== undefined ? Number(line.creditBase) : (Number(line.credit) || 0) * rate;

      totalDebitLocal += dBase;
      totalCreditLocal += cBase;
    }

    if (Math.abs(totalDebitLocal - totalCreditLocal) > 0.01) {
      errorResponse(res, 'القيد غير متزن: إجمالي المدين المحلي يجب أن يساوي إجمالي الدائن المحلي', 400);
      return;
    }

    await transaction(async (client) => {
      const yr = new Date(entryDate || Date.now()).getFullYear();
      const seqRes = await client.query(`SELECT COUNT(*) + 1 AS next_num FROM journal_entries WHERE entry_number LIKE $1`, [`JV-${yr}-%`]);
      const nextSeq = String(seqRes.rows[0].next_num).padStart(4, '0');
      const entryNumber = `JV-${yr}-${nextSeq}`;

      const totalDebitForeign = lines.reduce((s: number, l: any) => s + (Number(l.debit) || 0), 0);
      const totalCreditForeign = lines.reduce((s: number, l: any) => s + (Number(l.credit) || 0), 0);

      const jeResult = await client.query(
        `INSERT INTO journal_entries (
          entry_number, entry_date, period_id, description, reference_no, reference_type, 
          branch_id, currency_id, exchange_rate, total_debit, total_credit, created_by, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [
          entryNumber,
          entryDate || new Date().toISOString().split('T')[0],
          periodId || null,
          description || null,
          referenceNo || null,
          referenceType,
          branchId || req.user!.branchId,
          currencyId || null,
          rate,
          totalDebitForeign,
          totalCreditForeign,
          req.user!.userId,
          status
        ]
      );

      const jeId = jeResult.rows[0].id;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const debitForeign = Number(line.debit) || 0;
        const creditForeign = Number(line.credit) || 0;
        const debitBase = line.debitBase !== undefined ? Number(line.debitBase) : debitForeign * rate;
        const creditBase = line.creditBase !== undefined ? Number(line.creditBase) : creditForeign * rate;

        await client.query(
          `INSERT INTO journal_entry_lines (
            journal_entry_id, gl_account_id, cost_center_id, branch_id, cash_box_id, bank_account_id,
            customer_id, supplier_id, employee_id, project_id, debit, credit, debit_base, credit_base, line_description, sort_order
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
          [
            jeId,
            line.glAccountId,
            line.costCenterId || null,
            branchId || req.user!.branchId,
            line.cashBoxId || null,
            line.bankAccountId || null,
            line.customerId || null,
            line.supplierId || null,
            line.employeeId || null,
            line.projectId || null,
            debitForeign,
            creditForeign,
            debitBase,
            creditBase,
            line.description || line.line_description || '',
            i
          ]
        );
      }

      await client.query(
        `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, new_values, description)
         VALUES ($1, 'INSERT', 'journal_entries', $2, $3, $4)`,
        [req.user!.userId, jeId, JSON.stringify(jeResult.rows[0]), `إنشاء قيد يومية عام رقم ${entryNumber}`]
      );

      successResponse(res, jeResult.rows[0], 'تم حفظ القيد بنجاح', 201);
    });
  } catch (error: any) {
    errorResponse(res, 'خطأ في إنشاء القيد', 500, error.message);
  }
};

export const updateJournalEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      entryDate,
      periodId,
      description,
      referenceNo,
      referenceType,
      branchId,
      currencyId,
      exchangeRate = 1,
      status,
      lines = []
    } = req.body;

    const existing = await query(`SELECT * FROM journal_entries WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      errorResponse(res, 'القيد غير موجود', 404);
      return;
    }

    if (existing.rows[0].status === 'Posted') {
      errorResponse(res, 'لا يمكن تعديل قيد مرحل. يرجى عكس القيد بدلاً من ذلك.', 400);
      return;
    }

    if (!lines || lines.length === 0) {
      errorResponse(res, 'يجب إضافة سطر واحد على الأقل في القيد', 400);
      return;
    }

    const rate = Number(exchangeRate) || 1;
    let totalDebitLocal = 0;
    let totalCreditLocal = 0;

    for (const line of lines) {
      if (!line.glAccountId) {
        errorResponse(res, 'جميع السطور يجب أن تحتوي على حساب محاسبي صالح', 400);
        return;
      }
      const dBase = line.debitBase !== undefined ? Number(line.debitBase) : (Number(line.debit) || 0) * rate;
      const cBase = line.creditBase !== undefined ? Number(line.creditBase) : (Number(line.credit) || 0) * rate;
      totalDebitLocal += dBase;
      totalCreditLocal += cBase;
    }

    if (Math.abs(totalDebitLocal - totalCreditLocal) > 0.01) {
      errorResponse(res, 'القيد غير متزن: إجمالي المدين المحلي يجب أن يساوي إجمالي الدائن المحلي', 400);
      return;
    }

    await transaction(async (client) => {
      const totalDebitForeign = lines.reduce((s: number, l: any) => s + (Number(l.debit) || 0), 0);
      const totalCreditForeign = lines.reduce((s: number, l: any) => s + (Number(l.credit) || 0), 0);

      const jeResult = await client.query(
        `UPDATE journal_entries SET 
          entry_date = $1, period_id = $2, description = $3, reference_no = $4, reference_type = $5,
          branch_id = $6, currency_id = $7, exchange_rate = $8, total_debit = $9, total_credit = $10,
          status = COALESCE($11, status)
         WHERE id = $12 RETURNING *`,
        [
          entryDate,
          periodId || null,
          description || null,
          referenceNo || null,
          referenceType || 'GeneralJournal',
          branchId || req.user!.branchId,
          currencyId || null,
          rate,
          totalDebitForeign,
          totalCreditForeign,
          status || null,
          id
        ]
      );

      await client.query(`DELETE FROM journal_entry_lines WHERE journal_entry_id = $1`, [id]);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const debitForeign = Number(line.debit) || 0;
        const creditForeign = Number(line.credit) || 0;
        const debitBase = line.debitBase !== undefined ? Number(line.debitBase) : debitForeign * rate;
        const creditBase = line.creditBase !== undefined ? Number(line.creditBase) : creditForeign * rate;

        await client.query(
          `INSERT INTO journal_entry_lines (
            journal_entry_id, gl_account_id, cost_center_id, branch_id, cash_box_id, bank_account_id,
            customer_id, supplier_id, employee_id, project_id, debit, credit, debit_base, credit_base, line_description, sort_order
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
          [
            id,
            line.glAccountId,
            line.costCenterId || null,
            branchId || req.user!.branchId,
            line.cashBoxId || null,
            line.bankAccountId || null,
            line.customerId || null,
            line.supplierId || null,
            line.employeeId || null,
            line.projectId || null,
            debitForeign,
            creditForeign,
            debitBase,
            creditBase,
            line.description || line.line_description || '',
            i
          ]
        );
      }

      await client.query(
        `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, old_values, new_values, description)
         VALUES ($1, 'UPDATE', 'journal_entries', $2, $3, $4, $5)`,
        [req.user!.userId, id, JSON.stringify(existing.rows[0]), JSON.stringify(jeResult.rows[0]), `تعديل قيد يومية رقم ${existing.rows[0].entry_number}`]
      );

      successResponse(res, jeResult.rows[0], 'تم تحديث القيد بنجاح');
    });
  } catch (error: any) {
    errorResponse(res, 'خطأ في تحديث القيد', 500, error.message);
  }
};

export const updateJournalEntryStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    const existing = await query(`SELECT * FROM journal_entries WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      errorResponse(res, 'القيد غير موجود', 404);
      return;
    }

    const je = existing.rows[0];

    await transaction(async (client) => {
      if (action === 'Approve') {
        await client.query(
          `UPDATE journal_entries SET status = 'Approved', approved_by = $1 WHERE id = $2`,
          [req.user!.userId, id]
        );
        await client.query(
          `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description)
           VALUES ($1, 'APPROVE', 'journal_entries', $2, $3)`,
          [req.user!.userId, id, `اعتماد القيد اليومي رقم ${je.entry_number}`]
        );
        successResponse(res, { id, status: 'Approved' }, 'تم اعتماد القيد بنجاح');
      } else if (action === 'Post') {
        if (je.status === 'Posted') {
          errorResponse(res, 'القيد مرحل بالفعل', 400);
          return;
        }
        await client.query(
          `UPDATE journal_entries SET status = 'Posted', approved_by = COALESCE(approved_by, $1), posted_at = NOW() WHERE id = $2`,
          [req.user!.userId, id]
        );
        await client.query(
          `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description)
           VALUES ($1, 'POST', 'journal_entries', $2, $3)`,
          [req.user!.userId, id, `ترحيل القيد اليومي رقم ${je.entry_number}`]
        );
        successResponse(res, { id, status: 'Posted' }, 'تم ترحيل القيد بنجاح');
      } else if (action === 'Reverse') {
        const linesRes = await client.query(`SELECT * FROM journal_entry_lines WHERE journal_entry_id = $1`, [id]);
        const yr = new Date().getFullYear();
        const seqRes = await client.query(`SELECT COUNT(*) + 1 AS next_num FROM journal_entries WHERE entry_number LIKE $1`, [`JV-${yr}-%`]);
        const nextSeq = String(seqRes.rows[0].next_num).padStart(4, '0');
        const revEntryNumber = `JV-REV-${yr}-${nextSeq}`;

        const revJeRes = await client.query(
          `INSERT INTO journal_entries (
            entry_number, entry_date, period_id, description, reference_no, reference_type,
            reference_id, branch_id, currency_id, exchange_rate, total_debit, total_credit,
            created_by, approved_by, status, posted_at
          ) VALUES ($1, NOW(), $2, $3, $4, 'Reversal', $5, $6, $7, $8, $9, $10, $11, $11, 'Posted', NOW()) RETURNING *`,
          [
            revEntryNumber,
            je.period_id,
            `قيد عكسي للقيد رقم ${je.entry_number} - ${reason || ''}`,
            je.entry_number,
            je.id,
            je.branch_id,
            je.currency_id,
            je.exchange_rate,
            je.total_credit,
            je.total_debit,
            req.user!.userId
          ]
        );

        const revJeId = revJeRes.rows[0].id;

        for (let i = 0; i < linesRes.rows.length; i++) {
          const line = linesRes.rows[i];
          await client.query(
            `INSERT INTO journal_entry_lines (
              journal_entry_id, gl_account_id, cost_center_id, branch_id, cash_box_id, bank_account_id,
              customer_id, supplier_id, employee_id, project_id, debit, credit, debit_base, credit_base, line_description, sort_order
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
            [
              revJeId,
              line.gl_account_id,
              line.cost_center_id,
              line.branch_id,
              line.cash_box_id,
              line.bank_account_id,
              line.customer_id,
              line.supplier_id,
              line.employee_id,
              line.project_id,
              line.credit,
              line.debit,
              line.credit_base,
              line.debit_base,
              `عكس: ${line.line_description || ''}`,
              i
            ]
          );
        }

        await client.query(
          `UPDATE journal_entries SET status = 'Void', voided_by = $1, void_reason = $2 WHERE id = $3`,
          [req.user!.userId, `تم إنشاء قيد عكسي رقم ${revEntryNumber}`, id]
        );

        await client.query(
          `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description)
           VALUES ($1, 'VOID', 'journal_entries', $2, $3)`,
          [req.user!.userId, id, `عكس القيد رقم ${je.entry_number} وتوليد القيد العكسي رقم ${revEntryNumber}`]
        );

        successResponse(res, { id, status: 'Void', reversalEntryNumber: revEntryNumber }, `تم إنشاء القيد العكسي رقم ${revEntryNumber} بنجاح`);
      } else if (action === 'Void') {
        await client.query(
          `UPDATE journal_entries SET status = 'Void', voided_by = $1, void_reason = $2 WHERE id = $3`,
          [req.user!.userId, reason || 'إلغاء قيد', id]
        );
        await client.query(
          `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description)
           VALUES ($1, 'VOID', 'journal_entries', $2, $3)`,
          [req.user!.userId, id, `إلغاء القيد رقم ${je.entry_number}`]
        );
        successResponse(res, { id, status: 'Void' }, 'تم إلغاء القيد بنجاح');
      } else {
        const newStatus = action === 'Review' ? 'Approved' : 'Draft';
        await client.query(`UPDATE journal_entries SET status = $1 WHERE id = $2`, [newStatus, id]);
        successResponse(res, { id, status: newStatus }, `تم تغيير حالة القيد إلى ${newStatus}`);
      }
    });
  } catch (error: any) {
    errorResponse(res, 'خطأ في تحديث حالة القيد', 500, error.message);
  }
};

export const deleteJournalEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await query(`SELECT * FROM journal_entries WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      errorResponse(res, 'القيد غير موجود', 404);
      return;
    }
    if (existing.rows[0].status === 'Posted') {
      errorResponse(res, 'لا يمكن حذف قيد مرحل', 400);
      return;
    }
    await transaction(async (client) => {
      await client.query(`DELETE FROM journal_entry_lines WHERE journal_entry_id = $1`, [id]);
      await client.query(`DELETE FROM journal_entries WHERE id = $1`, [id]);
      await client.query(
        `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description)
         VALUES ($1, 'DELETE', 'journal_entries', $2, $3)`,
        [req.user!.userId, id, `حذف القيد رقم ${existing.rows[0].entry_number}`]
      );
    });
    successResponse(res, null, 'تم حذف القيد بنجاح');
  } catch (error: any) {
    errorResponse(res, 'خطأ في حذف القيد', 500, error.message);
  }
};



// ==========================================
// RECEIPT VOUCHERS CONTROLLER
// ==========================================

export const getReceiptVouchers = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT rv.*,
              cust.name_ar AS customer_name,
              cb.name_ar AS cash_box_name, cb.code AS cash_box_code,
              ba.name_ar AS bank_account_name, ba.account_number AS bank_account_number, ba.iban AS bank_iban,
              c.code AS currency_code, c.symbol AS currency_symbol
       FROM receipt_vouchers rv
       LEFT JOIN customers cust ON rv.customer_id = cust.id
       LEFT JOIN cash_boxes cb ON rv.cash_box_id = cb.id
       LEFT JOIN bank_accounts ba ON rv.bank_account_id = ba.id
       LEFT JOIN currencies c ON rv.currency_id = c.id
       WHERE rv.branch_id IN (SELECT id FROM branches WHERE company_id=$1)
       ORDER BY rv.voucher_date DESC, rv.created_at DESC`,
      [req.user!.companyId]
    );
    successResponse(res, result.rows);
  } catch (error: any) {
    errorResponse(res, 'خطأ في جلب سندات القبض', 500, error.message);
  }
};

export const createReceiptVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      voucherDate,
      customerId,
      branchId,
      paymentMethodId,
      cashBoxId,
      bankAccountId,
      postingMode = 'Immediate',
      dueDate,
      amount,
      currencyId,
      exchangeRate = 1,
      chequeNumber,
      chequeDate,
      bankName,
      description,
      status = 'Draft',
    } = req.body;

    if (!voucherDate || !amount || Number(amount) <= 0) {
      errorResponse(res, 'تاريخ السند والمبلغ المستلم مطلوبان ويجب أن يكون المبلغ أكبر من صفر', 400);
      return;
    }

    await transaction(async (client) => {
      const voucherNumber = `RV-${Date.now()}`;

      // Insert Receipt Voucher
      const result = await client.query(
        `INSERT INTO receipt_vouchers (
          voucher_number, voucher_date, customer_id, branch_id, payment_method_id,
          cash_box_id, bank_account_id, posting_mode, due_date, amount, currency_id,
          exchange_rate, cheque_number, cheque_date, bank_name, description, status, created_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
        [
          voucherNumber,
          voucherDate,
          customerId || null,
          branchId || req.user!.branchId,
          paymentMethodId || null,
          cashBoxId || null,
          bankAccountId || null,
          postingMode,
          dueDate || null,
          amount,
          currencyId || null,
          exchangeRate,
          chequeNumber || null,
          chequeDate || null,
          bankName || null,
          description || null,
          status,
          req.user!.userId,
        ]
      );

      const voucher = result.rows[0];

      // Audit Log
      await client.query(
        `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, new_values, description)
         VALUES ($1, 'INSERT', 'receipt_vouchers', $2, $3, $4)`,
        [req.user!.userId, voucher.id, JSON.stringify(voucher), `إنشاء سند قبض رقم ${voucherNumber}`]
      );

      // If status is Posted, execute Posting logic immediately
      if (status === 'Posted') {
        await executeReceiptVoucherPosting(client, voucher, req.user!.userId);
      }

      successResponse(res, voucher, 'تم إنشاء سند القبض بنجاح', 201);
    });
  } catch (error: any) {
    errorResponse(res, 'خطأ في إنشاء سند القبض', 500, error.message);
  }
};

export const updateReceiptVoucherStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'Approve' | 'Post' | 'Reverse'

    await transaction(async (client) => {
      const existing = await client.query(`SELECT * FROM receipt_vouchers WHERE id = $1`, [id]);
      if (existing.rows.length === 0) {
        errorResponse(res, 'سند القبض غير موجود', 404);
        return;
      }

      const voucher = existing.rows[0];

      if (action === 'Approve') {
        if (voucher.status !== 'Draft') {
          errorResponse(res, 'يمكن اعتماد السندات التي بحالة مسودة فقط', 400);
          return;
        }
        await client.query(
          `UPDATE receipt_vouchers SET status = 'Approved', approved_by = $1 WHERE id = $2`,
          [req.user!.userId, id]
        );
        await client.query(
          `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description)
           VALUES ($1, 'APPROVE', 'receipt_vouchers', $2, $3)`,
          [req.user!.userId, id, `اعتماد سند القبض رقم ${voucher.voucher_number}`]
        );
        successResponse(res, { id, status: 'Approved' }, 'تم اعتماد سند القبض بنجاح');
      } else if (action === 'Post') {
        if (voucher.status === 'Posted') {
          errorResponse(res, 'السند مرحل بالفعل', 400);
          return;
        }
        await executeReceiptVoucherPosting(client, voucher, req.user!.userId);
        successResponse(res, { id, status: 'Posted' }, 'تم ترحيل سند القبض وتحديث الحسابات بنجاح');
      } else if (action === 'Reject') {
        if (voucher.status === 'Posted' || voucher.status === 'Reversed') {
          errorResponse(res, 'لا يمكن رفض سند مرحل أو معكوس', 400);
          return;
        }
        await client.query(
          `UPDATE receipt_vouchers SET status = 'Rejected' WHERE id = $1`,
          [id]
        );
        await client.query(
          `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, old_values, new_values, ip_address, user_agent, description)
           VALUES ($1, 'VOID', 'receipt_vouchers', $2, $3, $4, $5, $6, $7)`,
          [req.user!.userId, id, JSON.stringify(voucher), JSON.stringify({ ...voucher, status: 'Rejected' }), (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1', req.headers['user-agent'] || 'Unknown', `رفض سند القبض رقم ${voucher.voucher_number}`]
        );
        successResponse(res, { id, status: 'Rejected' }, 'تم رفض سند القبض');
      } else {
        errorResponse(res, 'إجراء غير معروف', 400);
      }
    });
  } catch (error: any) {
    errorResponse(res, 'خطأ في تغيير حالة سند القبض', 500, error.message);
  }
};

// Internal Helper for Receipt Voucher Posting
async function executeReceiptVoucherPosting(client: any, voucher: any, userId: string) {
  // Determine Debit Account (Cash Box / Bank Account) and Credit Account (Customer / Revenue)
  let debitGlAccountId: string | null = null;
  let creditGlAccountId: string | null = null;

  if (voucher.cash_box_id) {
    const cb = await client.query(`SELECT gl_account_id FROM cash_boxes WHERE id = $1`, [voucher.cash_box_id]);
    if (cb.rows.length > 0) debitGlAccountId = cb.rows[0].gl_account_id;
    // Update Cash Box current balance
    await client.query(
      `UPDATE cash_boxes SET current_balance = current_balance + $1, updated_at = NOW() WHERE id = $2`,
      [voucher.amount, voucher.cash_box_id]
    );
  } else if (voucher.bank_account_id) {
    const ba = await client.query(`SELECT gl_account_id FROM bank_accounts WHERE id = $1`, [voucher.bank_account_id]);
    if (ba.rows.length > 0) debitGlAccountId = ba.rows[0].gl_account_id;
    // Update Bank Account current balance
    await client.query(
      `UPDATE bank_accounts SET current_balance = current_balance + $1, updated_at = NOW() WHERE id = $2`,
      [voucher.amount, voucher.bank_account_id]
    );
  }

  if (voucher.customer_id) {
    const cust = await client.query(`SELECT ar_account_id FROM customers WHERE id = $1`, [voucher.customer_id]);
    if (cust.rows.length > 0) creditGlAccountId = cust.rows[0].ar_account_id;
    // Update Customer balance (decrease balance)
    await client.query(
      `UPDATE customers SET balance = balance - $1 WHERE id = $2`,
      [voucher.amount, voucher.customer_id]
    );
  }

  // Fallback GL accounts if not mapped directly
  if (!debitGlAccountId) {
    const defaultCash = await client.query(`SELECT id FROM gl_accounts WHERE code LIKE '1101%' LIMIT 1`);
    debitGlAccountId = defaultCash.rows[0]?.id;
  }
  if (!creditGlAccountId) {
    const defaultAR = await client.query(`SELECT id FROM gl_accounts WHERE code LIKE '1102%' LIMIT 1`);
    creditGlAccountId = defaultAR.rows[0]?.id;
  }

  // Generate Journal Entry
  const jeNumber = `JE-RV-${voucher.voucher_number}`;
  const totalAmount = Number(voucher.amount);

  const jeRes = await client.query(
    `INSERT INTO journal_entries (
      entry_number, entry_date, description, reference_no, reference_type, branch_id,
      currency_id, exchange_rate, total_debit, total_credit, created_by, status, posted_at
    ) VALUES ($1,$2,$3,$4,'ReceiptVoucher',$5,$6,$7,$8,$9,$10,'Posted',NOW()) RETURNING id`,
    [
      jeNumber,
      voucher.voucher_date,
      voucher.description || `قيد ترحيل سند قبض رقم ${voucher.voucher_number}`,
      voucher.voucher_number,
      voucher.branch_id,
      voucher.currency_id,
      voucher.exchange_rate || 1,
      totalAmount,
      totalAmount,
      userId,
    ]
  );

  const jeId = jeRes.rows[0].id;

  // Insert Debit Line (Cash Box / Bank Account)
  await client.query(
    `INSERT INTO journal_entry_lines (
      journal_entry_id, gl_account_id, cash_box_id, bank_account_id, debit, credit, debit_base, credit_base, line_description, sort_order
    ) VALUES ($1,$2,$3,$4,$5,0,$6,0,$7,0)`,
    [
      jeId,
      debitGlAccountId,
      voucher.cash_box_id || null,
      voucher.bank_account_id || null,
      totalAmount,
      totalAmount * Number(voucher.exchange_rate || 1),
      `قبض من العميل - ${voucher.voucher_number}`,
    ]
  );

  // Insert Credit Line (Customer / AR)
  await client.query(
    `INSERT INTO journal_entry_lines (
      journal_entry_id, gl_account_id, customer_id, debit, credit, debit_base, credit_base, line_description, sort_order
    ) VALUES ($1,$2,$3,0,$4,0,$5,$6,1)`,
    [
      jeId,
      creditGlAccountId,
      voucher.customer_id || null,
      totalAmount,
      totalAmount * Number(voucher.exchange_rate || 1),
      `تسديد حساب العميل - ${voucher.voucher_number}`,
    ]
  );

  // Update Voucher status and journal reference
  await client.query(
    `UPDATE receipt_vouchers SET status = 'Posted', journal_entry_id = $1 WHERE id = $2`,
    [jeId, voucher.id]
  );

  // Audit Log
  await client.query(
    `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description)
     VALUES ($1, 'POST', 'receipt_vouchers', $2, $3)`,
    [userId, voucher.id, `ترحيل سند القبض رقم ${voucher.voucher_number} وتوليد القيد رقم ${jeNumber}`]
  );
}

// Internal Helper for Receipt Voucher Reversal
async function executeReceiptVoucherReversal(client: any, voucher: any, userId: string) {
  if (voucher.cash_box_id) {
    await client.query(`UPDATE cash_boxes SET current_balance = current_balance - $1 WHERE id = $2`, [voucher.amount, voucher.cash_box_id]);
  } else if (voucher.bank_account_id) {
    await client.query(`UPDATE bank_accounts SET current_balance = current_balance - $1 WHERE id = $2`, [voucher.amount, voucher.bank_account_id]);
  }

  if (voucher.customer_id) {
    await client.query(`UPDATE customers SET balance = balance + $1 WHERE id = $2`, [voucher.amount, voucher.customer_id]);
  }

  if (voucher.journal_entry_id) {
    await client.query(`UPDATE journal_entries SET status = 'Void', voided_by = $1, void_reason = 'عكس سند قبض' WHERE id = $2`, [userId, voucher.journal_entry_id]);
  }

  await client.query(`UPDATE receipt_vouchers SET status = 'Reversed' WHERE id = $1`, [voucher.id]);

  await client.query(
    `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description)
     VALUES ($1, 'VOID', 'receipt_vouchers', $2, $3)`,
    [userId, voucher.id, `عكس سند القبض رقم ${voucher.voucher_number}`]
  );
}


// ==========================================
// PAYMENT VOUCHERS CONTROLLER
// ==========================================

export const getPaymentVouchers = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT pv.*,
              supp.name_ar AS supplier_name,
              cb.name_ar AS cash_box_name, cb.code AS cash_box_code,
              ba.name_ar AS bank_account_name, ba.account_number AS bank_account_number, ba.iban AS bank_iban,
              c.code AS currency_code, c.symbol AS currency_symbol,
              (
                SELECT json_agg(
                  json_build_object(
                    'id', pvl.id,
                    'glAccountId', pvl.gl_account_id,
                    'costCenterId', pvl.cost_center_id,
                    'amount', pvl.amount,
                    'notes', pvl.notes
                  )
                ) FROM payment_voucher_lines pvl WHERE pvl.payment_voucher_id = pv.id
              ) AS lines
       FROM payment_vouchers pv
       LEFT JOIN suppliers supp ON pv.supplier_id = supp.id
       LEFT JOIN cash_boxes cb ON pv.cash_box_id = cb.id
       LEFT JOIN bank_accounts ba ON pv.bank_account_id = ba.id
       LEFT JOIN currencies c ON pv.currency_id = c.id
       WHERE pv.branch_id IN (SELECT id FROM branches WHERE company_id=$1)
       ORDER BY pv.voucher_date DESC, pv.created_at DESC`,
      [req.user!.companyId]
    );
    successResponse(res, result.rows);
  } catch (error: any) {
    errorResponse(res, 'خطأ في جلب سندات الصرف', 500, error.message);
  }
};

export const createPaymentVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      voucherDate,
      supplierId,
      beneficiaryName,
      branchId,
      paymentMethodId,
      cashBoxId,
      bankAccountId,
      postingMode = 'Immediate',
      dueDate,
      amount,
      currencyId,
      exchangeRate = 1,
      chequeNumber,
      chequeDate,
      bankName,
      description,
      status = 'Draft',
      lines = [],
    } = req.body;

    if (!voucherDate || !amount || Number(amount) <= 0) {
      errorResponse(res, 'تاريخ السند والمبلغ المصروف مطلوبان ويجب أن يكون المبلغ أكبر من صفر', 400);
      return;
    }

    await transaction(async (client) => {
      const voucherNumber = `PV-${Date.now()}`;

      const result = await client.query(
        `INSERT INTO payment_vouchers (
          voucher_number, voucher_date, supplier_id, beneficiary_name, branch_id,
          payment_method_id, cash_box_id, bank_account_id, posting_mode, due_date,
          amount, currency_id, exchange_rate, cheque_number, cheque_date, bank_name,
          description, status, created_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
        [
          voucherNumber,
          voucherDate,
          supplierId || null,
          beneficiaryName || null,
          branchId || req.user!.branchId,
          paymentMethodId || null,
          cashBoxId || null,
          bankAccountId || null,
          postingMode,
          dueDate || null,
          amount,
          currencyId || null,
          exchangeRate,
          chequeNumber || null,
          chequeDate || null,
          bankName || null,
          description || null,
          status,
          req.user!.userId,
        ]
      );

      const voucher = result.rows[0];

      // Insert Allocation lines if any
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.glAccountId && line.amount) {
          await client.query(
            `INSERT INTO payment_voucher_lines (payment_voucher_id, gl_account_id, cost_center_id, amount, notes, sort_order)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [voucher.id, line.glAccountId, line.costCenterId || null, line.amount, line.notes || null, i]
          );
        }
      }

      await client.query(
        `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, new_values, description)
         VALUES ($1, 'INSERT', 'payment_vouchers', $2, $3, $4)`,
        [req.user!.userId, voucher.id, JSON.stringify(voucher), `إنشاء سند صرف رقم ${voucherNumber}`]
      );

      if (status === 'Posted') {
        await executePaymentVoucherPosting(client, voucher, lines, req.user!.userId);
      }

      successResponse(res, voucher, 'تم إنشاء سند الصرف بنجاح', 201);
    });
  } catch (error: any) {
    errorResponse(res, 'خطأ في إنشاء سند الصرف', 500, error.message);
  }
};

export const updatePaymentVoucherStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    await transaction(async (client) => {
      const existing = await client.query(`SELECT * FROM payment_vouchers WHERE id = $1`, [id]);
      if (existing.rows.length === 0) {
        errorResponse(res, 'سند الصرف غير موجود', 404);
        return;
      }

      const voucher = existing.rows[0];

      if (action === 'Approve') {
        if (voucher.status !== 'Draft') {
          errorResponse(res, 'يمكن اعتماد السندات التي بحالة مسودة فقط', 400);
          return;
        }
        await client.query(
          `UPDATE payment_vouchers SET status = 'Approved', approved_by = $1 WHERE id = $2`,
          [req.user!.userId, id]
        );
        await client.query(
          `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description)
           VALUES ($1, 'APPROVE', 'payment_vouchers', $2, $3)`,
          [req.user!.userId, id, `اعتماد سند الصرف رقم ${voucher.voucher_number}`]
        );
        successResponse(res, { id, status: 'Approved' }, 'تم اعتماد سند الصرف بنجاح');
      } else if (action === 'Post') {
        if (voucher.status === 'Posted') {
          errorResponse(res, 'السند مرحل بالفعل', 400);
          return;
        }
        const linesRes = await client.query(`SELECT * FROM payment_voucher_lines WHERE payment_voucher_id = $1`, [id]);
        await executePaymentVoucherPosting(client, voucher, linesRes.rows, req.user!.userId);
        successResponse(res, { id, status: 'Posted' }, 'تم ترحيل سند الصرف وتحديث الحسابات بنجاح');
      } else if (action === 'Reverse') {
        if (voucher.status !== 'Posted') {
          errorResponse(res, 'يمكن إلغاء/عكس السندات المرحلة فقط', 400);
          return;
        }
        await executePaymentVoucherReversal(client, voucher, req.user!.userId);
        successResponse(res, { id, status: 'Reversed' }, 'تم عكس سند الصرف وتحديث الأرصدة بنجاح');
      } else if (action === 'Reject') {
        if (voucher.status === 'Posted' || voucher.status === 'Reversed') {
          errorResponse(res, 'لا يمكن رفض سند مرحل أو معكوس', 400);
          return;
        }
        await client.query(
          `UPDATE payment_vouchers SET status = 'Rejected' WHERE id = $1`,
          [id]
        );
        await client.query(
          `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, old_values, new_values, ip_address, user_agent, description)
           VALUES ($1, 'VOID', 'payment_vouchers', $2, $3, $4, $5, $6, $7)`,
          [req.user!.userId, id, JSON.stringify(voucher), JSON.stringify({ ...voucher, status: 'Rejected' }), (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1', req.headers['user-agent'] || 'Unknown', `رفض سند الصرف رقم ${voucher.voucher_number}`]
        );
        successResponse(res, { id, status: 'Rejected' }, 'تم رفض سند الصرف');
      } else {
        errorResponse(res, 'إجراء غير معروف', 400);
      }
    });
  } catch (error: any) {
    errorResponse(res, 'خطأ في تغيير حالة سند الصرف', 500, error.message);
  }
};

// Internal Helper for Payment Voucher Posting
async function executePaymentVoucherPosting(client: any, voucher: any, lines: any[], userId: string) {
  let creditGlAccountId: string | null = null;

  if (voucher.cash_box_id) {
    const cb = await client.query(`SELECT gl_account_id FROM cash_boxes WHERE id = $1`, [voucher.cash_box_id]);
    if (cb.rows.length > 0) creditGlAccountId = cb.rows[0].gl_account_id;
    await client.query(
      `UPDATE cash_boxes SET current_balance = current_balance - $1, updated_at = NOW() WHERE id = $2`,
      [voucher.amount, voucher.cash_box_id]
    );
  } else if (voucher.bank_account_id) {
    const ba = await client.query(`SELECT gl_account_id FROM bank_accounts WHERE id = $1`, [voucher.bank_account_id]);
    if (ba.rows.length > 0) creditGlAccountId = ba.rows[0].gl_account_id;
    await client.query(
      `UPDATE bank_accounts SET current_balance = current_balance - $1, updated_at = NOW() WHERE id = $2`,
      [voucher.amount, voucher.bank_account_id]
    );
  }

  if (voucher.supplier_id) {
    await client.query(
      `UPDATE suppliers SET balance = balance - $1 WHERE id = $2`,
      [voucher.amount, voucher.supplier_id]
    );
  }

  if (!creditGlAccountId) {
    const defaultCash = await client.query(`SELECT id FROM gl_accounts WHERE code LIKE '1101%' LIMIT 1`);
    creditGlAccountId = defaultCash.rows[0]?.id;
  }

  const jeNumber = `JE-PV-${voucher.voucher_number}`;
  const totalAmount = Number(voucher.amount);

  const jeRes = await client.query(
    `INSERT INTO journal_entries (
      entry_number, entry_date, description, reference_no, reference_type, branch_id,
      currency_id, exchange_rate, total_debit, total_credit, created_by, status, posted_at
    ) VALUES ($1,$2,$3,$4,'PaymentVoucher',$5,$6,$7,$8,$9,$10,'Posted',NOW()) RETURNING id`,
    [
      jeNumber,
      voucher.voucher_date,
      voucher.description || `قيد ترحيل سند صرف رقم ${voucher.voucher_number}`,
      voucher.voucher_number,
      voucher.branch_id,
      voucher.currency_id,
      voucher.exchange_rate || 1,
      totalAmount,
      totalAmount,
      userId,
    ]
  );

  const jeId = jeRes.rows[0].id;

  // Insert Debit Lines (Expense Allocations or Supplier AP)
  if (lines && lines.length > 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineAmount = Number(line.amount || 0);
      await client.query(
        `INSERT INTO journal_entry_lines (
          journal_entry_id, gl_account_id, cost_center_id, supplier_id, debit, credit, debit_base, credit_base, line_description, sort_order
        ) VALUES ($1,$2,$3,$4,$5,0,$6,0,$7,$8)`,
        [
          jeId,
          line.glAccountId || line.gl_account_id,
          line.costCenterId || line.cost_center_id || null,
          voucher.supplier_id || null,
          lineAmount,
          lineAmount * Number(voucher.exchange_rate || 1),
          line.notes || `صرف - ${voucher.voucher_number}`,
          i,
        ]
      );
    }
  } else {
    // Single Debit to Supplier AP or Default Expense
    let debitGlAccountId: string | null = null;
    if (voucher.supplier_id) {
      const supp = await client.query(`SELECT ap_account_id FROM suppliers WHERE id = $1`, [voucher.supplier_id]);
      if (supp.rows.length > 0) debitGlAccountId = supp.rows[0].ap_account_id;
    }
    if (!debitGlAccountId) {
      const defaultExp = await client.query(`SELECT id FROM gl_accounts WHERE code LIKE '5%' LIMIT 1`);
      debitGlAccountId = defaultExp.rows[0]?.id;
    }

    await client.query(
      `INSERT INTO journal_entry_lines (
        journal_entry_id, gl_account_id, supplier_id, debit, credit, debit_base, credit_base, line_description, sort_order
      ) VALUES ($1,$2,$3,$4,0,$5,0,$6,0)`,
      [
        jeId,
        debitGlAccountId,
        voucher.supplier_id || null,
        totalAmount,
        totalAmount * Number(voucher.exchange_rate || 1),
        `سداد للمورد - ${voucher.voucher_number}`,
      ]
    );
  }

  // Insert Credit Line (Cash Box / Bank Account)
  await client.query(
    `INSERT INTO journal_entry_lines (
      journal_entry_id, gl_account_id, cash_box_id, bank_account_id, debit, credit, debit_base, credit_base, line_description, sort_order
    ) VALUES ($1,$2,$3,$4,0,$5,0,$6,$7,99)`,
    [
      jeId,
      creditGlAccountId,
      voucher.cash_box_id || null,
      voucher.bank_account_id || null,
      totalAmount,
      totalAmount * Number(voucher.exchange_rate || 1),
      `صرف من الخزينة/البنك - ${voucher.voucher_number}`,
    ]
  );

  await client.query(
    `UPDATE payment_vouchers SET status = 'Posted', journal_entry_id = $1 WHERE id = $2`,
    [jeId, voucher.id]
  );

  await client.query(
    `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description)
     VALUES ($1, 'POST', 'payment_vouchers', $2, $3)`,
    [userId, voucher.id, `ترحيل سند الصرف رقم ${voucher.voucher_number} وتوليد القيد رقم ${jeNumber}`]
  );
}

// Internal Helper for Payment Voucher Reversal
async function executePaymentVoucherReversal(client: any, voucher: any, userId: string) {
  if (voucher.cash_box_id) {
    await client.query(`UPDATE cash_boxes SET current_balance = current_balance + $1 WHERE id = $2`, [voucher.amount, voucher.cash_box_id]);
  } else if (voucher.bank_account_id) {
    await client.query(`UPDATE bank_accounts SET current_balance = current_balance + $1 WHERE id = $2`, [voucher.amount, voucher.bank_account_id]);
  }

  if (voucher.supplier_id) {
    await client.query(`UPDATE suppliers SET balance = balance + $1 WHERE id = $2`, [voucher.amount, voucher.supplier_id]);
  }

  if (voucher.journal_entry_id) {
    await client.query(`UPDATE journal_entries SET status = 'Void', voided_by = $1, void_reason = 'عكس سند صرف' WHERE id = $2`, [userId, voucher.journal_entry_id]);
  }

  await client.query(`UPDATE payment_vouchers SET status = 'Reversed' WHERE id = $1`, [voucher.id]);

  await client.query(
    `INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description)
     VALUES ($1, 'VOID', 'payment_vouchers', $2, $3)`,
    [userId, voucher.id, `عكس سند الصرف رقم ${voucher.voucher_number}`]
  );
}
