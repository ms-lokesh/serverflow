import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  UtensilsCrossed,
  ChefHat,
  ShoppingBag,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  Lock,
  Search,
  KeyRound,
  UserX,
  UserCheck,
  Edit2,
  AlertTriangle,
  History,
  X,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface EmployeeRecord {
  id: string;
  restaurantId: string;
  employeeId: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'ADMIN' | 'DINING' | 'KITCHEN' | 'TAKEAWAY';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export const EmployeeManagementScreen: React.FC = () => {
  const { user: authUser } = useAuth();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);
  const [resetPasswordEmployee, setResetPasswordEmployee] = useState<EmployeeRecord | null>(null);
  const [deactivateEmployee, setDeactivateEmployee] = useState<EmployeeRecord | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Add Employee Form State
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addRole, setAddRole] = useState<'DINING' | 'KITCHEN' | 'TAKEAWAY' | 'ADMIN'>('DINING');
  const [addPassword, setAddPassword] = useState('');
  const [addConfirmPassword, setAddConfirmPassword] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccessMessage, setAddSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset Password State
  const [newTempPassword, setNewTempPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await api.employees.list({
        q: searchQuery,
        role: selectedRoleFilter !== 'ALL' ? selectedRoleFilter : undefined,
      });
      if (res.success && res.data) {
        setEmployees(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch employees', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [searchQuery, selectedRoleFilter]);

  const fetchAuditLogs = async () => {
    try {
      const res = await api.employees.auditLogs();
      if (res.success && res.data) {
        setAuditLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    }
  };

  const getRoleTheme = (roleStr: string) => {
    const r = roleStr.toUpperCase();
    switch (r) {
      case 'ADMIN':
        return {
          label: 'Admin',
          icon: ShieldCheck,
          bg: 'bg-red-50 text-red-700 border-red-200',
          avatarBg: 'bg-red-100 text-red-800',
          border: 'border-red-300',
        };
      case 'DINING':
        return {
          label: 'Dining',
          icon: UtensilsCrossed,
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          avatarBg: 'bg-blue-100 text-blue-800',
          border: 'border-blue-300',
        };
      case 'KITCHEN':
        return {
          label: 'Kitchen',
          icon: ChefHat,
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
          avatarBg: 'bg-orange-100 text-orange-800',
          border: 'border-orange-300',
        };
      case 'TAKEAWAY':
        return {
          label: 'Takeaway',
          icon: ShoppingBag,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          avatarBg: 'bg-emerald-100 text-emerald-800',
          border: 'border-emerald-300',
        };
      default:
        return {
          label: roleStr,
          icon: Users,
          bg: 'bg-gray-50 text-gray-700 border-gray-200',
          avatarBg: 'bg-gray-100 text-gray-800',
          border: 'border-gray-300',
        };
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccessMessage(null);

    if (addPassword !== addConfirmPassword) {
      setAddError('Password and Confirm Password do not match.');
      return;
    }

    if (addPassword.length < 6) {
      setAddError('Password must be at least 6 characters long.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.employees.create({
        name: addName.trim(),
        email: addEmail.trim() || undefined,
        phone: addPhone.trim() || undefined,
        role: addRole,
        password: addPassword,
        confirmPassword: addConfirmPassword,
      });

      if (res.success && res.data) {
        setAddSuccessMessage(`Employee created successfully! Employee ID: ${res.data.employeeId}`);
        setAddName('');
        setAddEmail('');
        setAddPhone('');
        setAddPassword('');
        setAddConfirmPassword('');
        fetchEmployees();
        setTimeout(() => {
          setIsAddModalOpen(false);
          setAddSuccessMessage(null);
        }, 1800);
      }
    } catch (err: any) {
      setAddError(err.message || 'Failed to create employee');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    setIsSaving(true);
    try {
      const res = await api.employees.update(editingEmployee.id, {
        name: editingEmployee.name,
        email: editingEmployee.email,
        phone: editingEmployee.phone,
        role: editingEmployee.role,
        status: editingEmployee.status,
      });

      if (res.success) {
        setEditingEmployee(null);
        fetchEmployees();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update employee');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (emp: EmployeeRecord) => {
    try {
      if (emp.status === 'ACTIVE') {
        await api.employees.deactivate(emp.id);
      } else {
        await api.employees.activate(emp.id);
      }
      setDeactivateEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordEmployee || !newTempPassword) return;

    if (newTempPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }

    setIsSaving(true);
    setResetError(null);
    try {
      const res = await api.employees.resetPassword(resetPasswordEmployee.id, newTempPassword);
      if (res.success) {
        alert(`Password for ${resetPasswordEmployee.name} (${resetPasswordEmployee.employeeId}) has been reset.`);
        setResetPasswordEmployee(null);
        setNewTempPassword('');
      }
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pb-28 w-full max-w-7xl mx-auto min-h-screen bg-[#F8F8F6] px-4 sm:px-6 lg:px-8 pt-4">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl border border-[#E8E6E3] px-6 py-5 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-extrabold text-[#242424] tracking-tight">
              Employee Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-extrabold uppercase tracking-wide">
              ADMIN CONTROL
            </span>
          </div>
          <p className="text-[13px] text-[#737373] mt-1 font-medium">
            Manage restaurant personnel, role assignments, security credentials, and access control.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              fetchAuditLogs();
              setIsAuditModalOpen(true);
            }}
            className="py-2.5 px-3.5 rounded-xl border border-[#E8E6E3] hover:bg-[#F8F8F6] text-[#555] font-bold text-[13px] flex items-center gap-2 transition-all active:scale-95"
            title="View Security Audit Logs"
          >
            <History className="w-4 h-4 text-[#737373]" />
            <span>Audit Trail</span>
          </button>

          <button
            onClick={() => {
              setAddError(null);
              setAddSuccessMessage(null);
              setIsAddModalOpen(true);
            }}
            id="btn-add-employee"
            className="py-2.5 px-4 rounded-xl bg-[#C94B4B] text-white font-extrabold text-[13.5px] flex items-center gap-2 shadow-md shadow-[#C94B4B]/20 hover:bg-[#A83B3B] active:scale-95 transition-all"
          >
            <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Filters Bar: Search & Role Tabs */}
      <div className="bg-white rounded-2xl border border-[#E8E6E3] p-3 shadow-2xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID (e.g. DIN-001), email..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[#242424] text-[13px] font-semibold focus:outline-none focus:border-[#C94B4B] focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-[#888] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Roles' },
            { id: 'ADMIN', label: 'Admin (Red)' },
            { id: 'DINING', label: 'Dining (Blue)' },
            { id: 'KITCHEN', label: 'Kitchen (Orange)' },
            { id: 'TAKEAWAY', label: 'Takeaway (Green)' },
          ].map((tab) => {
            const isActive = selectedRoleFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-extrabold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#242424] text-white'
                    : 'text-[#666] hover:bg-[#F8F8F6] hover:text-[#242424]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Employees Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-[#737373] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#C94B4B]" />
          <span className="text-[14px] font-semibold">Loading employees from database...</span>
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E8E6E3] p-12 text-center text-[#737373]">
          <Users className="w-12 h-12 text-[#CCC] mx-auto mb-3" />
          <h3 className="text-[16px] font-extrabold text-[#242424]">No employees found</h3>
          <p className="text-[13px] mt-1">Try adjusting your search filter or add a new team member.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {employees.map((emp) => {
            const theme = getRoleTheme(emp.role);
            const RoleIcon = theme.icon;
            const isInactive = emp.status === 'INACTIVE';
            const isCurrentUser = authUser?.id === emp.id;

            return (
              <div
                key={emp.id}
                className={`bg-white rounded-3xl p-5 border shadow-xs transition-all flex flex-col justify-between ${
                  isInactive
                    ? 'border-gray-200 opacity-70 bg-gray-50/50'
                    : 'border-[#E8E6E3] hover:border-[#C94B4B]/30 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top Row: Avatar + Role Badge + Status */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[18px] shadow-xs ${theme.avatarBg}`}
                      >
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-[15.5px] font-extrabold text-[#242424] leading-snug">
                          {emp.name}
                        </h3>
                        <span className="font-mono text-[12px] font-bold text-[#737373]">
                          {emp.employeeId}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${theme.bg}`}
                      >
                        <RoleIcon className="w-3 h-3" />
                        <span>{theme.label}</span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          isInactive
                            ? 'bg-gray-100 text-gray-600 border border-gray-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isInactive ? 'bg-gray-400' : 'bg-emerald-500'
                          }`}
                        />
                        {emp.status}
                      </span>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-1.5 py-3 border-y border-[#F5F5F3] text-[12px] text-[#666]">
                    {emp.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#999]" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                    )}
                    {emp.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#999]" />
                        <span>{emp.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-[#888] pt-1">
                      <Clock className="w-3 h-3 text-[#AAA]" />
                      <span>
                        Last login:{' '}
                        {emp.lastLoginAt
                          ? new Date(emp.lastLoginAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: 'numeric',
                              month: 'short',
                            })
                          : 'Never logged in'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 flex items-center gap-2">
                  <button
                    onClick={() => setEditingEmployee(emp)}
                    className="flex-1 py-2 px-2.5 rounded-xl border border-[#E8E6E3] hover:bg-[#F8F8F6] text-[#333] font-bold text-[12px] flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#666]" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      setResetError(null);
                      setResetPasswordEmployee(emp);
                    }}
                    className="py-2 px-2.5 rounded-xl border border-[#E8E6E3] hover:bg-amber-50 text-amber-700 font-bold text-[12px] flex items-center gap-1 transition-all"
                    title="Reset Employee Password"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>

                  {!isCurrentUser && (
                    <button
                      onClick={() => setDeactivateEmployee(emp)}
                      className={`py-2 px-2.5 rounded-xl border font-bold text-[12px] flex items-center gap-1 transition-all ${
                        isInactive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                      title={isInactive ? 'Reactivate Account' : 'Deactivate Account'}
                    >
                      {isInactive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                      <span>{isInactive ? 'Activate' : 'Deactivate'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Add Employee */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-[#E8E6E3] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F3]">
              <div>
                <h3 className="text-[19px] font-extrabold text-[#242424]">Add Restaurant Employee</h3>
                <p className="text-[12px] text-[#737373]">Initial password will be securely hashed with Argon2id.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-[#888] hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-[12.5px] font-semibold border border-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            {addSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-[12.5px] font-bold border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{addSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleAddEmployee} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-extrabold text-[#555] uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Arun Kumar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13.5px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-[#555] uppercase tracking-wider mb-1">
                    Role *
                  </label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B] focus:bg-white"
                  >
                    <option value="DINING">Dining Staff (Blue)</option>
                    <option value="KITCHEN">Kitchen Staff (Orange)</option>
                    <option value="TAKEAWAY">Takeaway Staff (Green)</option>
                    <option value="ADMIN">Administrator (Red)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#555] uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13.5px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#555] uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="employee@serveflow.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13.5px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-[#555] uppercase tracking-wider mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13.5px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-[#555] uppercase tracking-wider mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={addConfirmPassword}
                    onChange={(e) => setAddConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13.5px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B] focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-[#E8E6E3] text-[#555] font-bold text-[13.5px] hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl bg-[#C94B4B] text-white font-extrabold text-[13.5px] shadow-md shadow-[#C94B4B]/25 hover:bg-[#A83B3B] active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Create Employee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Employee */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-[#E8E6E3]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F3]">
              <div>
                <h3 className="text-[18px] font-extrabold text-[#242424]">Edit Employee</h3>
                <span className="text-[12px] font-mono text-[#737373]">
                  ID: {editingEmployee.employeeId}
                </span>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="p-1 rounded-lg text-[#888] hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-extrabold text-[#555] uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editingEmployee.name}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13.5px] font-semibold text-[#242424]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#555] uppercase tracking-wider mb-1">
                  Assigned Role
                </label>
                <select
                  value={editingEmployee.role}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, role: e.target.value as any })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13px] font-semibold text-[#242424]"
                >
                  <option value="DINING">Dining Staff (Blue)</option>
                  <option value="KITCHEN">Kitchen Staff (Orange)</option>
                  <option value="TAKEAWAY">Takeaway Staff (Green)</option>
                  <option value="ADMIN">Administrator (Red)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#555] uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={editingEmployee.status}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, status: e.target.value as any })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13px] font-semibold text-[#242424]"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#555] uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingEmployee.email || ''}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13.5px] font-semibold text-[#242424]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-[#555] uppercase tracking-wider mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editingEmployee.phone || ''}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, phone: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13.5px] font-semibold text-[#242424]"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="flex-1 py-3 rounded-xl border border-[#E8E6E3] text-[#555] font-bold text-[13.5px] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl bg-[#C94B4B] text-white font-extrabold text-[13.5px] shadow-md shadow-[#C94B4B]/25 hover:bg-[#A83B3B]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Reset Password */}
      {resetPasswordEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-[#E8E6E3]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F3]">
              <div>
                <h3 className="text-[18px] font-extrabold text-[#242424]">Reset Password</h3>
                <span className="text-[12px] text-[#737373]">
                  {resetPasswordEmployee.name} ({resetPasswordEmployee.employeeId})
                </span>
              </div>
              <button
                onClick={() => setResetPasswordEmployee(null)}
                className="p-1 rounded-lg text-[#888] hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-[12.5px] font-semibold border border-red-200">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold text-[#555] uppercase tracking-wider mb-1">
                  New Temporary Password
                </label>
                <input
                  type="password"
                  required
                  value={newTempPassword}
                  onChange={(e) => setNewTempPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E6E3] bg-[#F8F8F6] text-[13.5px] font-semibold text-[#242424] focus:outline-none focus:border-[#C94B4B]"
                />
                <p className="text-[11px] text-[#888] mt-1">
                  The password will be hashed with Argon2id and cannot be retrieved again.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordEmployee(null)}
                  className="flex-1 py-3 rounded-xl border border-[#E8E6E3] text-[#555] font-bold text-[13px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !newTempPassword}
                  className="flex-1 py-3 rounded-xl bg-amber-600 text-white font-extrabold text-[13px] hover:bg-amber-700 shadow-md shadow-amber-600/25"
                >
                  Set New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Deactivate / Activate Confirmation */}
      {deactivateEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-[#E8E6E3]">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-[18px] font-extrabold text-[#242424]">
                {deactivateEmployee.status === 'ACTIVE'
                  ? 'Deactivate Employee?'
                  : 'Reactivate Employee?'}
              </h3>
              <p className="text-[12.5px] text-[#737373] mt-1.5 leading-normal">
                {deactivateEmployee.status === 'ACTIVE'
                  ? `Deactivating ${deactivateEmployee.name} will immediately block login, but preserve all historical orders, KOTs, and audit logs.`
                  : `Reactivating ${deactivateEmployee.name} will restore login and role permissions immediately.`}
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setDeactivateEmployee(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8E6E3] text-[#555] font-bold text-[13px]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleStatus(deactivateEmployee)}
                className={`flex-1 py-2.5 rounded-xl text-white font-extrabold text-[13px] shadow-sm ${
                  deactivateEmployee.status === 'ACTIVE'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {deactivateEmployee.status === 'ACTIVE' ? 'Confirm Deactivate' : 'Confirm Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Audit Trail Drawer */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 border border-[#E8E6E3] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F3]">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#C94B4B]" />
                <h3 className="text-[18px] font-extrabold text-[#242424]">Security & Employee Audit Trail</h3>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1 rounded-lg text-[#888] hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {auditLogs.length === 0 ? (
                <p className="text-center py-8 text-[#888] text-[13px]">No audit logs recorded yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-[#F8F8F6] border border-[#E8E6E3] text-[12.5px] flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#242424]">{log.action}</span>
                        <span className="px-1.5 py-0.2 rounded bg-gray-200 text-[#555] text-[10px] font-mono">
                          {log.entity_type}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-[#737373] mt-0.5">
                        Actor: {log.actor_name || 'System'} ({log.actor_employee_id || 'SYSTEM'})
                      </div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="text-[11px] font-mono text-[#666] mt-1 bg-white p-1.5 rounded border border-gray-200">
                          {JSON.stringify(log.metadata)}
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-[#999] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
