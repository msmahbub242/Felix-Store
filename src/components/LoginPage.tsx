import React, { useState } from 'react';
import { useFabricStore } from '../context/FabricStoreContext';
import {
  Layers,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Building,
  KeyRound,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ROLE_LABELS, UserRole } from '../types/fabric';

export const LoginPage: React.FC = () => {
  const { login, users } = useFabricStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Please enter your Email or Employee ID.');
      return;
    }

    setIsLoading(true);

    // Brief realistic processing feedback
    setTimeout(() => {
      const result = login(identifier, password, remember);
      setIsLoading(false);
      if (!result.success && result.error) {
        setErrorMessage(result.error);
      }
    }, 250);
  };

  const handleSelectAccount = (emailOrId: string) => {
    setIdentifier(emailOrId);
    setPassword('');
    setErrorMessage('');
  };

  const registeredPersonnel: {
    role: UserRole;
    name: string;
    id: string;
    email: string;
    department: string;
    badgeBg: string;
  }[] = [
    {
      role: 'master_admin',
      name: 'Felix Vance',
      id: 'EMP-001',
      email: 'felixstore926@gmail.com',
      department: 'Store Administration',
      badgeBg: 'bg-purple-600',
    },
    {
      role: 'store_in_charge',
      name: 'Rahman Kabir',
      id: 'EMP-104',
      email: 'rahman.k@felixstore.com',
      department: 'Fabric Warehouse Operations',
      badgeBg: 'bg-blue-600',
    },
    {
      role: 'operator',
      name: 'Karim Ullah',
      id: 'EMP-215',
      email: 'karim.u@felixstore.com',
      department: 'Receiving & Barcoding Floor',
      badgeBg: 'bg-emerald-600',
    },
    {
      role: 'cutting_floor',
      name: 'Salim Akhtar',
      id: 'EMP-308',
      email: 'salim.a@felixstore.com',
      department: 'Cutting Room Unit 1',
      badgeBg: 'bg-amber-600',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative warehouse grid ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Icon & Heading */}
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 text-white flex items-center justify-center shadow-lg ring-4 ring-white/5">
            <Layers className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <h2 className="text-center text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
          FELIX FABRIC STORE MANAGEMENT
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400 font-medium">
          Central Warehouse, PO Fulfillment &amp; Roll Ledger Portal
        </p>

        <div className="mt-2 flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/70 border border-blue-700/50 text-blue-300">
            <Shield className="w-3 h-3 text-blue-400" />
            <span>Authorized Textile Personnel Sign-In</span>
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-200">
          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Authentication Failed:</span> {errorMessage}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address or Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="e.g. EMP-001 or felixstore926@gmail.com"
                  className="block w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Security Passcode / Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your confidential password"
                  className="block w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white focus:border-transparent transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-xs text-slate-600">Keep session active</span>
              </label>
              <span className="text-xs text-slate-500 font-medium">SSL Encrypted</span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg shadow-sm text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <span>Verifying credentials...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span>Sign In to Fabric Store</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Personnel Account Select */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Select Registered Personnel:</span>
              </span>
              <span className="text-[11px] text-slate-400">Click to autofill ID</span>
            </div>

            <div className="space-y-2">
              {registeredPersonnel.map(person => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => handleSelectAccount(person.email)}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className={`w-7 h-7 rounded-md ${person.badgeBg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                    >
                      {person.name[0]}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                        <span>{person.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${ROLE_LABELS[person.role].badgeColor}`}
                        >
                          {ROLE_LABELS[person.role].label}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">
                        {person.id} · {person.department}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    Select ID →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security & Audit Footer Notice */}
        <div className="mt-4 text-center text-xs text-slate-400">
          <p>
            Felix Fabric Store &amp; Garment Warehouse Management System
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Goods Received Notes (GRN) &amp; Issue Slips are attributed to the active officer's session.
          </p>
        </div>
      </div>
    </div>
  );
};
