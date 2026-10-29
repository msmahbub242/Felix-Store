import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  LayoutDashboard,
  FileSpreadsheet,
  PackagePlus,
  ArrowUpRight,
  ClipboardList,
  Grid3X3,
  Clock,
  RotateCcw,
  Users,
  ChevronDown,
  Shield,
  Check,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { useFabricStore } from '../context/FabricStoreContext';
import { ROLE_LABELS } from '../types/fabric';

export type ActiveTab =
  | 'dashboard'
  | 'pos'
  | 'receive'
  | 'issue'
  | 'inventory'
  | 'racks'
  | 'slow-moving'
  | 'users';

interface TopBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onQuickReceive?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ activeTab, setActiveTab }) => {
  const {
    stats,
    resetToInitialData,
    users,
    currentUser,
    switchUser,
    hasPermission,
    logout,
  } = useFabricStore();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const canReceive = hasPermission('canReceiveFabric');
  const canReset = hasPermission('canSystemReset');
  const isMasterAdmin = currentUser.role === 'master_admin';
  const currentRoleInfo = ROLE_LABELS[currentUser.role];

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'pos', label: 'PO Master', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'receive', label: 'Receive Fabric', icon: <PackagePlus className="w-4 h-4" /> },
    { id: 'issue', label: 'Issue to Cutting', icon: <ArrowUpRight className="w-4 h-4" /> },
    { id: 'inventory', label: 'Inventory Report', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'racks', label: 'Rack Layout', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'slow-moving', label: 'Slow Moving', icon: <Clock className="w-4 h-4" /> },
    ...(isMasterAdmin
      ? [{ id: 'users' as ActiveTab, label: 'Users & Roles', icon: <Users className="w-4 h-4" /> }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 no-print">
      {/* 3-Zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4 sm:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <a
              href="#dashboard"
              onClick={e => {
                e.preventDefault();
                setActiveTab('dashboard');
              }}
              className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-blue-700 transition-colors"
            >
              FELIX FABRIC STORE MANAGEMENT
            </a>
          </div>

          {/* Zone 2: Navigation Links (Single-line, unboxed text links) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6 overflow-x-auto py-2">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors py-1.5 px-1 border-b-2 ${
                    isActive
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.id === 'slow-moving' && stats.slowMovingRollsCount > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-mono px-1.5 py-0.2 rounded-full font-bold">
                      {stats.slowMovingRollsCount}
                    </span>
                  )}
                  {item.id === 'users' && (
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-mono px-1.5 py-0.2 rounded-full font-bold">
                      {users.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: User Switcher & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* User Profile Switcher Popover */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors"
              >
                <div
                  className={`w-7 h-7 rounded-md ${currentUser.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0`}
                >
                  {currentUser.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1">
                    <span className="max-w-[110px] truncate">{currentUser.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                    {currentRoleInfo.label}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2.5 border-b border-slate-100">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Current Active User
                    </div>
                    <div className="font-bold text-sm text-slate-900">{currentUser.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{currentUser.email}</div>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${currentRoleInfo.badgeColor}`}
                      >
                        {currentRoleInfo.label}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        {currentUser.employeeId}
                      </span>
                    </div>
                  </div>

                  <div className="px-3.5 py-2">
                    <div className="text-[11px] text-slate-500 italic text-center py-1">
                      Sign out to switch account
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 px-3 space-y-1">
                    {isMasterAdmin && (
                      <button
                        onClick={() => {
                          setActiveTab('users');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-center py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        Manage Users &amp; Permissions →
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Reset Button (Gated to Master Admin) */}
            <button
              onClick={resetToInitialData}
              disabled={!canReset}
              title={
                !canReset
                  ? 'Master Admin privileges required to reset seed data'
                  : 'Reset Demo Seed Data'
              }
              className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                canReset
                  ? 'text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer'
                  : 'text-slate-300 bg-slate-50 cursor-not-allowed opacity-60'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            {/* Quick Receive Button (Respects permissions) */}
            <button
              onClick={() => setActiveTab('receive')}
              disabled={!canReceive}
              title={
                !canReceive
                  ? 'Receiving permission required to log fabric rolls'
                  : 'Receive new rolls into warehouse'
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0 ${
                canReceive
                  ? 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <PackagePlus className="w-4 h-4 text-blue-300" />
              <span className="hidden sm:inline">Receive Rolls</span>
              <span className="sm:hidden">Receive</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation bar */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 text-xs whitespace-nowrap shrink-0 px-2.5 py-1 rounded-md transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

