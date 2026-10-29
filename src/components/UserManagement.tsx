import React, { useState } from 'react';
import { useFabricStore } from '../context/FabricStoreContext';
import {
  StoreUser,
  UserRole,
  UserPermission,
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_LABELS,
} from '../types/fabric';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  UserCheck,
  Building,
  Mail,
  Phone,
  KeyRound,
  Lock,
  Unlock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const {
    users,
    currentUser,
    switchUser,
    addUser,
    updateUser,
    deleteUser,
    hasPermission,
  } = useFabricStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StoreUser | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    employeeId: string;
    role: UserRole;
    department: string;
    phone: string;
    password: string;
    status: 'Active' | 'Suspended';
    avatarBg: string;
    permissions: UserPermission;
  }>({
    name: '',
    email: '',
    employeeId: '',
    role: 'operator',
    department: '',
    phone: '',
    password: 'operator123',
    status: 'Active',
    avatarBg: 'bg-emerald-600',
    permissions: { ...ROLE_DEFAULT_PERMISSIONS.operator },
  });

  const canManageUsers = currentUser.role === 'master_admin';

  // Strict Security Guard: Only Master Admin can view or access this console
  if (!canManageUsers) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto my-12 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Access Restricted: Master Admin Only</h2>
        <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
          The User Management &amp; Role-Based Access Control (RBAC) console is strictly reserved for the Master Administrator. Other users are not permitted to view personnel accounts, reassign roles, or alter security permissions.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200">
          <span className="text-slate-500">Current Session:</span>
          <span className="font-bold text-slate-900">{currentUser.name}</span>
          <span className="text-slate-400">({ROLE_LABELS[currentUser.role].label})</span>
        </div>
      </div>
    );
  }

  const openAddModal = () => {
    setEditingUser(null);
    const nextEmpNum = users.length + 101;
    setFormData({
      name: '',
      email: '',
      employeeId: `EMP-${nextEmpNum}`,
      role: 'operator',
      department: 'Fabric Warehouse Floor',
      phone: '',
      password: 'store123',
      status: 'Active',
      avatarBg: 'bg-emerald-600',
      permissions: { ...ROLE_DEFAULT_PERMISSIONS.operator },
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: StoreUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      department: user.department,
      phone: user.phone || '',
      password: user.password || 'store123',
      status: user.status,
      avatarBg: user.avatarBg,
      permissions: { ...user.permissions },
    });
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    let newBg = 'bg-slate-600';
    if (newRole === 'master_admin') newBg = 'bg-purple-600';
    else if (newRole === 'store_in_charge') newBg = 'bg-blue-600';
    else if (newRole === 'operator') newBg = 'bg-emerald-600';
    else if (newRole === 'cutting_floor') newBg = 'bg-amber-600';

    setFormData(prev => ({
      ...prev,
      role: newRole,
      avatarBg: newBg,
      permissions: { ...ROLE_DEFAULT_PERMISSIONS[newRole] },
    }));
  };

  const handlePermissionToggle = (permKey: keyof UserPermission) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permKey]: !prev.permissions[permKey],
      },
    }));
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please provide at least a user name and email address.');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        employeeId: formData.employeeId.trim(),
        role: formData.role,
        department: formData.department.trim(),
        phone: formData.phone.trim(),
        password: formData.password.trim() || 'store123',
        status: formData.status,
        avatarBg: formData.avatarBg,
        permissions: formData.permissions,
      });
    } else {
      addUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        employeeId: formData.employeeId.trim(),
        role: formData.role,
        department: formData.department.trim(),
        phone: formData.phone.trim(),
        password: formData.password.trim() || 'store123',
        status: formData.status,
        avatarBg: formData.avatarBg,
        permissions: formData.permissions,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (userId: string, userName: string) => {
    if (users.length <= 1) {
      alert('Cannot delete the last remaining system user.');
      return;
    }
    if (confirm(`Are you sure you want to delete user "${userName}"? This cannot be undone.`)) {
      deleteUser(userId);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const permissionList: { key: keyof UserPermission; label: string; desc: string }[] = [
    { key: 'canManageUsers', label: 'Manage Users & Permissions', desc: 'Create, modify user accounts and alter roles' },
    { key: 'canManagePOs', label: 'PO Master Management', desc: 'Create, edit and manage Purchase Orders' },
    { key: 'canReceiveFabric', label: 'Fabric Receiving (GRN)', desc: 'Register supplier delivery, inspect and auto-serial rolls' },
    { key: 'canIssueFabric', label: 'Fabric Issuing (Cutting)', desc: 'Issue full or partial rolls to cutting floor with slips' },
    { key: 'canManageRacks', label: 'Rack Layout & Relocation', desc: 'Create warehouse racks and move roll storage locations' },
    { key: 'canViewReports', label: 'Stock & Inventory Reports', desc: 'Access real-time roll balance, color & lot inventory' },
    { key: 'canViewSlowMoving', label: 'Slow Moving Stock Analytics', desc: 'Audit aged rolls (>60 days), evaluate write-downs' },
    { key: 'canDeleteRecords', label: 'Delete Records & POs', desc: 'Privileged deletion of orders, rolls, or receipts' },
    { key: 'canSystemReset', label: 'System Configuration & Reset', desc: 'Reset database to factory seed data' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-700" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              User Management &amp; Role-Based Access Control (RBAC)
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Configure access authorities for Master Admin, Store In-Charge, Store Operators, and Cutting Floor personnel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'users'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 inline mr-1.5" />
              Users Directory ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'matrix'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 inline mr-1.5" />
              Permission Matrix
            </button>
          </div>

          <button
            onClick={openAddModal}
            disabled={!canManageUsers}
            title={!canManageUsers ? 'Master Admin privileges required to create users' : 'Create new store user'}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors ${
              canManageUsers
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Current Active User Status Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-700">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl ${currentUser.avatarBg} text-white flex items-center justify-center font-bold text-lg shadow-inner ring-2 ring-white/20`}
            >
              {currentUser.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-base font-bold text-white">{currentUser.name}</span>
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${
                    ROLE_LABELS[currentUser.role].badgeColor
                  }`}
                >
                  {ROLE_LABELS[currentUser.role].label}
                </span>
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-slate-300 font-mono">
                  {currentUser.employeeId}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {currentUser.department} · {currentUser.email}
              </p>
            </div>
          </div>

          {/* Quick Simulation / Role Switcher for Store Personnel */}
          <div className="bg-white/10 rounded-lg p-2.5 flex items-center gap-3 border border-white/10 w-full lg:w-auto">
            <div className="text-xs text-slate-200 shrink-0">
              <span className="font-semibold block">Quick Floor Switch:</span>
              <span className="text-[11px] text-slate-400">Simulate role view</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full">
              {users.slice(0, 4).map(u => (
                <button
                  key={u.id}
                  onClick={() => switchUser(u.id)}
                  className={`px-2 py-1.5 rounded text-xs text-left truncate transition-colors ${
                    u.id === currentUser.id
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <div className="font-semibold truncate">{u.name.split(' ')[0]}</div>
                  <div className="text-[10px] opacity-80 truncate">{ROLE_LABELS[u.role].label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Role Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(ROLE_LABELS) as UserRole[]).map(roleKey => {
          const roleInfo = ROLE_LABELS[roleKey];
          const count = users.filter(u => u.role === roleKey).length;
          return (
            <div
              key={roleKey}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-md border mb-2 ${roleInfo.badgeColor}`}
                  >
                    {roleInfo.label}
                  </span>
                  <div className="text-2xl font-bold text-slate-900 font-mono">{count}</div>
                  <div className="text-xs text-slate-500">Assigned Users</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
                  <Shield className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 line-clamp-2">
                {roleInfo.description}
              </p>
            </div>
          );
        })}
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user by name, email, employee ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="bg-white text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Roles</option>
                <option value="master_admin">Master Admin</option>
                <option value="store_in_charge">Store In-Charge</option>
                <option value="operator">Store Operator</option>
                <option value="cutting_floor">Cutting Floor</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-white text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">User &amp; Employee ID</th>
                  <th className="py-3 px-4">Role &amp; Department</th>
                  <th className="py-3 px-4">Key Permissions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No store users found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => {
                    const isSelf = u.id === currentUser.id;
                    const roleInfo = ROLE_LABELS[u.role];

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-slate-50/75 transition-colors ${
                          isSelf ? 'bg-purple-50/30' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-lg ${u.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}
                            >
                              {u.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isSelf && (
                                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                                    Current
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 text-[11px] font-mono flex items-center gap-1.5 flex-wrap">
                                <span>{u.employeeId}</span>
                                <span>·</span>
                                <span>{u.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md border mb-1 ${roleInfo.badgeColor}`}
                          >
                            {roleInfo.label}
                          </span>
                          <div className="text-[11px] text-slate-500">{u.department}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {u.permissions.canManageUsers && (
                              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                Admin
                              </span>
                            )}
                            {u.permissions.canManagePOs && (
                              <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                POs
                              </span>
                            )}
                            {u.permissions.canReceiveFabric && (
                              <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                Receive
                              </span>
                            )}
                            {u.permissions.canIssueFabric && (
                              <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                Issue
                              </span>
                            )}
                            {u.permissions.canManageRacks && (
                              <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                Racks
                              </span>
                            )}
                            {u.permissions.canViewSlowMoving && (
                              <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                Aging
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              u.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.status === 'Active' ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}
                            />
                            {u.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {u.lastLogin || 'Never'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isSelf && (
                              <button
                                onClick={() => switchUser(u.id)}
                                title="Switch session to this user"
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] flex items-center gap-1 transition-colors"
                              >
                                <UserCheck className="w-3 h-3 text-emerald-600" />
                                <span>Switch</span>
                              </button>
                            )}

                            <button
                              onClick={() => openEditModal(u)}
                              disabled={!canManageUsers && !isSelf}
                              title={
                                !canManageUsers && !isSelf
                                  ? 'Only Master Admin can edit other users'
                                  : 'Edit user profile and permissions'
                              }
                              className={`p-1.5 rounded transition-colors ${
                                canManageUsers || isSelf
                                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                  : 'text-slate-300 cursor-not-allowed'
                              }`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDelete(u.id, u.name)}
                              disabled={!canManageUsers || isSelf || users.length <= 1}
                              title={
                                isSelf
                                  ? 'Cannot delete your own active account'
                                  : !canManageUsers
                                  ? 'Master Admin privileges required'
                                  : 'Delete user'
                              }
                              className={`p-1.5 rounded transition-colors ${
                                canManageUsers && !isSelf && users.length > 1
                                  ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                                  : 'text-slate-300 cursor-not-allowed'
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Permission Matrix View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">
              Operational Authority Matrix &amp; Separation of Duties
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison of warehouse authorities enforced across Felix Fabric Store operations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-1/3">Feature / Capability</th>
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map(roleKey => (
                    <th key={roleKey} className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${ROLE_LABELS[roleKey].badgeColor}`}
                      >
                        {ROLE_LABELS[roleKey].label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {permissionList.map(item => (
                  <tr key={item.key} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.label}</div>
                      <div className="text-[11px] text-slate-500">{item.desc}</div>
                    </td>
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map(roleKey => {
                      const isAllowed = ROLE_DEFAULT_PERMISSIONS[roleKey][item.key];
                      return (
                        <td key={roleKey} className="py-3 px-4 text-center">
                          {isAllowed ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400">
                              <XCircle className="w-4 h-4" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingUser ? `Edit User: ${editingUser.name}` : 'Add New Store Personnel'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Tariq Mehmood"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="tariq.m@felixstore.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="EMP-150"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 012-3456"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Security Passcode / Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter confidential password"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Kept secret and confidential.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department / Area
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Fabric Store / Cutting Room"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Store Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={e => handleRoleChange(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-semibold"
                  >
                    <option value="master_admin">Master Admin (Full System Control)</option>
                    <option value="store_in_charge">Store In-Charge (Warehouse Supervisor)</option>
                    <option value="operator">Store Operator (Receiving &amp; Dispatch)</option>
                    <option value="cutting_floor">Cutting Floor User (Requisition &amp; Inspection)</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-4 pt-2">
                <span className="text-xs font-semibold text-slate-700">Account Status:</span>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === 'Active'}
                    onChange={() => setFormData({ ...formData, status: 'Active' })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Active</span>
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === 'Suspended'}
                    onChange={() => setFormData({ ...formData, status: 'Suspended' })}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>Suspended</span>
                </label>
              </div>

              {/* Granular Permissions Section */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-700" />
                    <span>Granular Authorities &amp; Permissions</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData(prev => ({
                        ...prev,
                        permissions: { ...ROLE_DEFAULT_PERMISSIONS[formData.role] },
                      }))
                    }
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Reset to Role Defaults
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-56 overflow-y-auto">
                  {permissionList.map(perm => {
                    const isChecked = !!formData.permissions[perm.key];
                    const isMasterAdminRole = formData.role === 'master_admin';

                    return (
                      <label
                        key={perm.key}
                        className={`flex items-start gap-2 p-2 rounded border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-white border-slate-300 shadow-2xs'
                            : 'bg-slate-100/50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isMasterAdminRole}
                          onChange={() => handlePermissionToggle(perm.key)}
                          className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        <div>
                          <div className="font-semibold text-slate-800 leading-tight">
                            {perm.label}
                          </div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                            {perm.desc}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {formData.role === 'master_admin' && (
                  <p className="text-[11px] text-purple-700 mt-1 font-medium">
                    * Master Admin accounts retain full system permissions by policy.
                  </p>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
