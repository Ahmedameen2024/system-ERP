import { useState, useEffect } from 'react';
import api from '../../api/client';

interface User {
  id: string;
  username: string;
  name_ar: string;
  name_en: string;
  email: string;
  role_id: string;
  role_name: string;
  branch_id: string;
  branch_name: string;
  status: 'Active' | 'Inactive';
  last_login: string;
}

interface Role {
  id: string;
  name_ar: string;
  name_en: string;
}

interface Branch {
  id: string;
  name_ar: string;
}

interface PermissionRow {
  moduleName: string;
  screenName: string;
  screenLabel: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canPrint: boolean;
  canExport: boolean;
}

const DEFAULT_SCREENS = [
  { moduleName: 'system', screenName: 'company_profile', screenLabel: 'الملف التعريفي للشركة' },
  { moduleName: 'system', screenName: 'branches', screenLabel: 'إدارة الفروع' },
  { moduleName: 'accounting', screenName: 'chart_of_accounts', screenLabel: 'دليل الحسابات' },
  { moduleName: 'accounting', screenName: 'journal_entries', screenLabel: 'القيود اليومية' },
  { moduleName: 'sales', screenName: 'sales_invoices', screenLabel: 'فواتير المبيعات' },
  { moduleName: 'purchasing', screenName: 'purchase_orders', screenLabel: 'أوامر الشراء' },
  { moduleName: 'hr', screenName: 'employees', screenLabel: 'بيانات الموظفين' }
];

export default function UsersPermissions() {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [permissionsMatrix, setPermissionsMatrix] = useState<PermissionRow[]>([]);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    nameAr: '',
    email: '',
    roleId: '',
    branchId: '',
    status: 'Active' as 'Active' | 'Inactive',
    password: ''
  });

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleForm, setRoleForm] = useState({ nameAr: '', nameEn: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'roles' && selectedRoleId) {
      fetchPermissions(selectedRoleId);
    }
  }, [activeSubTab, selectedRoleId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [usrRes, roleRes, branchRes] = await Promise.all([
        api.get('/setup/users?limit=100'),
        api.get('/setup/roles'),
        api.get('/setup/branches?limit=100')
      ]);
      setUsers(usrRes.data.data || []);
      setRoles(roleRes.data.data || []);
      setBranches(branchRes.data.data || []);
      
      if (roleRes.data.data && roleRes.data.data.length > 0) {
        setSelectedRoleId(roleRes.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch users and roles', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async (roleId: string) => {
    try {
      const res = await api.get(`/setup/permissions/${roleId}`);
      const savedPerms: any[] = res.data.data || [];
      
      const matrix = DEFAULT_SCREENS.map(screen => {
        const saved = savedPerms.find(p => p.module_name === screen.moduleName && p.screen_name === screen.screenName);
        return {
          moduleName: screen.moduleName,
          screenName: screen.screenName,
          screenLabel: screen.screenLabel,
          canView: saved?.can_view ?? false,
          canCreate: saved?.can_create ?? false,
          canEdit: saved?.can_edit ?? false,
          canDelete: saved?.can_delete ?? false,
          canApprove: saved?.can_approve ?? false,
          canPrint: saved?.can_print ?? false,
          canExport: saved?.can_export ?? false,
        };
      });
      setPermissionsMatrix(matrix);
    } catch (err) {
      console.error('Failed to fetch permissions', err);
    }
  };

  const togglePermission = (idx: number, field: keyof Omit<PermissionRow, 'moduleName' | 'screenName' | 'screenLabel'>) => {
    setPermissionsMatrix(permissionsMatrix.map((row, rIdx) => {
      if (rIdx === idx) {
        return { ...row, [field]: !row[field] };
      }
      return row;
    }));
  };

  const savePermissions = async () => {
    try {
      await api.put(`/setup/permissions/${selectedRoleId}`, { permissions: permissionsMatrix });
      alert('تم حفظ الصلاحيات بنجاح');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save permissions');
    }
  };

  const handleUserSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editUser) {
        await api.put(`/setup/users/${editUser.id}`, userForm);
      } else {
        await api.post('/setup/users', userForm);
      }
      setShowUserModal(false);
      fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleRoleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/setup/roles', roleForm);
      const newRole = res.data.data;
      setRoles([...roles, newRole]);
      setSelectedRoleId(newRole.id);
      setShowRoleModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save role');
    }
  };

  const openAddUser = () => {
    setEditUser(null);
    setUserForm({
      username: '',
      nameAr: '',
      email: '',
      roleId: roles.length > 0 ? roles[0].id : '',
      branchId: branches.length > 0 ? branches[0].id : '',
      status: 'Active',
      password: ''
    });
    setShowUserModal(true);
  };

  const openEditUser = (u: User) => {
    setEditUser(u);
    setUserForm({
      username: u.username,
      nameAr: u.name_ar,
      email: u.email,
      roleId: u.role_id,
      branchId: u.branch_id,
      status: u.status,
      password: ''
    });
    setShowUserModal(true);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-outline-variant)' }}>
        <button className={`btn ${activeSubTab === 'users' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveSubTab('users')} style={{ borderRadius: '0.5rem 0.5rem 0 0' }}>
          إدارة المستخدمين
        </button>
        <button className={`btn ${activeSubTab === 'roles' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveSubTab('roles')} style={{ borderRadius: '0.5rem 0.5rem 0 0' }}>
          أدوار وصلاحيات النظام
        </button>
      </div>

      {activeSubTab === 'users' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>مستخدمو النظام الحاليون</h2>
            <button className="btn btn-primary btn-sm" onClick={openAddUser}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
              مستخدم جديد
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>جاري التحميل...</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>اسم المستخدم</th>
                    <th>الاسم الكامل</th>
                    <th>البريد الإلكتروني</th>
                    <th>الدور الوظيفي</th>
                    <th>الفرع المنتسب</th>
                    <th>الحالة</th>
                    <th>آخر ظهور</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><span className="numeric" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{u.username}</span></td>
                      <td style={{ fontWeight: 500 }}>{u.name_ar}</td>
                      <td className="numeric">{u.email}</td>
                      <td><span className="chip chip-info">{u.role_name}</span></td>
                      <td>{u.branch_name}</td>
                      <td>
                        <span className={`chip ${u.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                          {u.status === 'Active' ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td className="numeric" style={{ fontSize: '0.75rem' }}>{u.last_login ? new Date(u.last_login).toLocaleString() : '—'}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEditUser(u)} title="تعديل">
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>لا يوجد مستخدمين</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {showUserModal && (
            <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
              <div className="modal-box" onClick={e => e.stopPropagation()}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                  {editUser ? 'تعديل بيانات المستخدم' : 'إنشاء مستخدم جديد'}
                </h2>
                <form onSubmit={handleUserSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label>اسم المستخدم (الدخول) *</label>
                      <input className="input" value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} required disabled={!!editUser} />
                    </div>
                    <div>
                      <label>الاسم الكامل (عربي) *</label>
                      <input className="input" value={userForm.nameAr} onChange={e => setUserForm({ ...userForm, nameAr: e.target.value })} required />
                    </div>
                    <div>
                      <label>البريد الإلكتروني *</label>
                      <input className="input" type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
                    </div>
                    <div>
                      <label>كلمة المرور {editUser ? '(اتركها فارغة لعدم التغيير)' : '*'}</label>
                      <input className="input" type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required={!editUser} />
                    </div>
                    <div>
                      <label>الدور الوظيفي *</label>
                      <select className="input" value={userForm.roleId} onChange={e => setUserForm({ ...userForm, roleId: e.target.value })} required>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name_ar}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>الفرع الافتراضي *</label>
                      <select className="input" value={userForm.branchId} onChange={e => setUserForm({ ...userForm, branchId: e.target.value })}>
                        <option value="">لا يوجد فرع (كل الفروع)</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name_ar}</option>)}
                      </select>
                    </div>
                    <div>
                      <label>الحالة</label>
                      <select className="input" value={userForm.status} onChange={e => setUserForm({ ...userForm, status: e.target.value as 'Active' | 'Inactive' })}>
                        <option value="Active">نشط</option>
                        <option value="Inactive">معطل</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowUserModal(false)}>إلغاء</button>
                    <button type="submit" className="btn btn-primary">حفظ البيانات</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>تحديد الدور الوظيفي للتعديل:</span>
              <select className="input" style={{ maxWidth: 220 }} value={selectedRoleId} onChange={e => setSelectedRoleId(e.target.value)}>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name_ar}</option>)}
              </select>
            </div>
            <div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowRoleModal(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                إضافة دور جديد
              </button>
              <button className="btn btn-primary btn-sm" onClick={savePermissions} style={{ marginRight: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
                حفظ الصلاحيات
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>الوحدة البرمجية / الشاشة</th>
                  <th style={{ textAlign: 'center' }}>عرض</th>
                  <th style={{ textAlign: 'center' }}>إضافة</th>
                  <th style={{ textAlign: 'center' }}>تعديل</th>
                  <th style={{ textAlign: 'center' }}>حذف</th>
                  <th style={{ textAlign: 'center' }}>اعتماد</th>
                  <th style={{ textAlign: 'center' }}>طباعة</th>
                  <th style={{ textAlign: 'center' }}>تصدير</th>
                </tr>
              </thead>
              <tbody>
                {permissionsMatrix.map((row, idx) => (
                  <tr key={row.screenName}>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{row.screenLabel}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', fontWeight: 400 }}>{row.moduleName}/{row.screenName}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={row.canView} onChange={() => togglePermission(idx, 'canView')} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={row.canCreate} onChange={() => togglePermission(idx, 'canCreate')} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={row.canEdit} onChange={() => togglePermission(idx, 'canEdit')} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={row.canDelete} onChange={() => togglePermission(idx, 'canDelete')} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={row.canApprove} onChange={() => togglePermission(idx, 'canApprove')} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={row.canPrint} onChange={() => togglePermission(idx, 'canPrint')} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={row.canExport} onChange={() => togglePermission(idx, 'canExport')} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showRoleModal && (
            <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
              <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>إضافة دور وظيفي جديد</h2>
                <form onSubmit={handleRoleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label>الاسم العربي للدور *</label>
                    <input className="input" value={roleForm.nameAr} onChange={e => setRoleForm({ ...roleForm, nameAr: e.target.value })} required />
                  </div>
                  <div>
                    <label>الاسم الإنجليزي للدور *</label>
                    <input className="input" value={roleForm.nameEn} onChange={e => setRoleForm({ ...roleForm, nameEn: e.target.value })} required />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowRoleModal(false)}>إلغاء</button>
                    <button type="submit" className="btn btn-primary">حفظ</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
