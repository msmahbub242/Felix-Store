import React from 'react';
import { useFabricStore } from '../context/FabricStoreContext';
import { ActiveTab } from './TopBar';
import {
  Layers,
  Package,
  FileSpreadsheet,
  PackagePlus,
  ArrowUpRight,
  Clock,
  Grid3X3,
  TrendingUp,
  AlertTriangle,
  Building,
  CheckCircle2,
  Calendar,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

import { ROLE_LABELS } from '../types/fabric';

interface DashboardProps {
  setActiveTab: (tab: ActiveTab) => void;
  onNavigateToReceive: (poNumber?: string) => void;
  onNavigateToIssue: (poNumber?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  onNavigateToReceive,
  onNavigateToIssue,
}) => {
  const { stats, pos, rolls, receives, issues, racks, currentUser } = useFabricStore();
  const currentRole = ROLE_LABELS[currentUser.role];

  const now = new Date();

  // Slow moving rolls calculation
  const slowRolls = rolls.filter(r => {
    if (r.currentWeight <= 0.001) return false;
    const rcvDate = new Date(r.receiveDate);
    const diffDays = Math.ceil(Math.abs(now.getTime() - rcvDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 60;
  });

  // Fabric type distribution
  const fabricTypeMap: Record<string, number> = {};
  rolls.forEach(r => {
    if (r.currentWeight > 0.001) {
      fabricTypeMap[r.fabricType] = (fabricTypeMap[r.fabricType] || 0) + r.currentWeight;
    }
  });

  // Buyer distribution
  const buyerMap: Record<string, number> = {};
  rolls.forEach(r => {
    if (r.currentWeight > 0.001) {
      buyerMap[r.buyer] = (buyerMap[r.buyer] || 0) + r.currentWeight;
    }
  });

  // Recent 4 receives and 4 issues
  const recentReceives = receives.slice(0, 4);
  const recentIssues = issues.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome & Shift Kicker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Central Fabric Store &amp; Warehouse Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time fabric inventory, roll tracking, cutting room issues, and warehouse rack occupancy.
          </p>
        </div>

        {/* Quick Launch Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>New PO</span>
          </button>
          <button
            onClick={() => onNavigateToReceive()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Receive Fabric</span>
          </button>
          <button
            onClick={() => onNavigateToIssue()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
            <span>Issue to Cutting</span>
          </button>
        </div>
      </div>

      {/* Role & Operator Status Bar */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg ${currentUser.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0`}
          >
            {currentUser.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">{currentUser.name}</span>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${currentRole.badgeColor}`}>
                {currentRole.label}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">{currentUser.employeeId}</span>
            </div>
            <div className="text-slate-500 text-[11px]">
              {currentUser.department} · {currentRole.description}
            </div>
          </div>
        </div>

        {currentUser.role === 'master_admin' && (
          <button
            onClick={() => setActiveTab('users')}
            className="text-blue-600 hover:text-blue-800 font-semibold text-xs flex items-center gap-1 hover:underline shrink-0"
          >
            <span>Manage Roles &amp; Permissions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Top Level Metric KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Total Fabric In Stock */}
        <div className="bg-white p-4 rounded-xl border border-[#2700ff] shadow-xs text-center" style={{ backgroundColor: '#ffffff', borderColor: '#2700ff' }}>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Total Fabric in Stock</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-[27px] font-black font-mono text-emerald-700 mt-2 text-center" style={{ fontSize: '27px', textAlign: 'center' }}>
            {stats.totalInStockKg.toLocaleString()} <span className="text-xs font-normal text-slate-500">KG</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{stats.totalActiveRolls} Active Rolls in Racks</span>
            <span className="text-emerald-700 font-semibold font-mono">100% Verified</span>
          </div>
        </div>

        {/* KPI 2: Total Active Rolls */}
        <div className="bg-white p-4 rounded-xl border border-[#0068ff] shadow-xs text-center" style={{ borderColor: '#0068ff' }}>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Fabric Rolls in Store</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-[26px] font-black font-mono text-slate-900 mt-2 text-center" style={{ fontSize: '26px', textAlign: 'center' }}>
            {stats.totalActiveRolls} <span className="text-xs font-normal text-slate-500">Rolls</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.totalExhaustedRolls} rolls fully issued to cutting
          </div>
        </div>

        {/* KPI 3: Purchase Orders */}
        <div className="bg-white p-4 rounded-xl border border-[#006dff] shadow-xs text-center" style={{ borderColor: '#006dff' }}>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Active PO Orders</span>
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-[26px] font-black font-mono text-slate-900 mt-2 text-center" style={{ fontSize: '26px', textAlign: 'center' }}>
            {stats.activePosCount} <span className="text-xs font-normal text-slate-500">/ {stats.totalPosCount} Total</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {pos.reduce((sum, p) => sum + p.orderQty, 0).toLocaleString()} KG total order target
          </div>
        </div>

        {/* KPI 4: Slow Moving Fabric */}
        <div
          onClick={() => setActiveTab('slow-moving')}
          className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-amber-800">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Slow-Moving Fabric
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-900 font-mono px-1.5 py-0.5 rounded font-bold">
              &gt;60 Days
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-900 mt-2">
            {stats.slowMovingKg.toLocaleString()} <span className="text-xs font-normal text-slate-500">KG</span>
          </div>
          <div className="text-[11px] text-amber-700 mt-1 flex items-center justify-between">
            <span>{stats.slowMovingRollsCount} rolls pending issue</span>
            <span className="text-xs font-semibold text-amber-800">Review &rarr;</span>
          </div>
        </div>
      </div>

      {/* RACK WISE DASHBOARD (Core User Requirement) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-slate-700" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Rack-Wise Warehouse Occupancy Dashboard
              </h2>
              <p className="text-xs text-slate-500">
                Visual utilization of physical storage racks, capacity limits, and stored weight.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('racks')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Manage All Racks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Rack cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {racks.map(rack => {
            const rackRolls = rolls.filter(r => r.rackNo === rack.name && r.currentWeight > 0.001);
            const totalKg = rackRolls.reduce((sum, r) => sum + r.currentWeight, 0);
            const utilizationPct = Math.min(100, Math.round((totalKg / rack.capacityKg) * 100));

            // Determine vibrant theme based on utilization or zone
            let themeGradient = 'from-blue-600 to-indigo-700 text-white';
            let badgeBg = 'bg-blue-500/20 text-white border-blue-400/30';
            let barColor = 'bg-white';
            let cardBg = 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-md border-slate-700';

            if (rack.name.startsWith('Rack A')) {
              themeGradient = 'from-emerald-600 to-teal-800 text-white';
              badgeBg = 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30';
              cardBg = 'bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white shadow-md border-emerald-800/60';
              barColor = 'bg-emerald-400';
            } else if (rack.name.startsWith('Rack B')) {
              themeGradient = 'from-indigo-600 to-blue-800 text-white';
              badgeBg = 'bg-blue-400/20 text-blue-200 border-blue-400/30';
              cardBg = 'bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white shadow-md border-indigo-800/60';
              barColor = 'bg-blue-400';
            } else if (rack.name.startsWith('Rack C')) {
              themeGradient = 'from-purple-600 to-pink-800 text-white';
              badgeBg = 'bg-purple-400/20 text-purple-200 border-purple-400/30';
              cardBg = 'bg-gradient-to-br from-purple-950 via-slate-900 to-slate-950 text-white shadow-md border-purple-800/60';
              barColor = 'bg-purple-400';
            } else if (rack.name.startsWith('Rack D')) {
              themeGradient = 'from-amber-600 to-orange-800 text-white';
              badgeBg = 'bg-amber-400/20 text-amber-200 border-amber-400/30';
              cardBg = 'bg-gradient-to-br from-amber-950 via-slate-900 to-slate-950 text-white shadow-md border-amber-800/60';
              barColor = 'bg-amber-400';
            }

            return (
              <div
                key={rack.id}
                onClick={() => setActiveTab('racks')}
                className={`p-4 rounded-xl border cursor-pointer hover:scale-[1.02] transition-all duration-200 relative overflow-hidden ${cardBg}`}
              >
                {/* Glow accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-black text-white text-base tracking-wide flex items-center gap-1.5">
                    <Grid3X3 className="w-4 h-4 opacity-70" />
                    {rack.name}
                  </span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                    {utilizationPct}% Full
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 font-medium truncate mb-3">
                  {rack.zone}
                </div>

                {/* Occupancy bar */}
                <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10 mb-3">
                  <div
                    className={`h-full rounded-full ${barColor} shadow-xs transition-all duration-500`}
                    style={{ width: `${Math.max(8, utilizationPct)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-white/10">
                  <span className="font-black text-white text-sm">{totalKg.toLocaleString()} <span className="text-[10px] font-normal text-slate-300">KG</span></span>
                  <span className="text-slate-300 bg-white/10 px-2 py-0.5 rounded text-[11px] font-semibold">{rackRolls.length} Rolls</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle Grid: Fabric & Buyer Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fabric Type Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Fabric Type Distribution (In Stock)
            </h3>
            <span className="text-xs font-mono text-slate-500">{Object.keys(fabricTypeMap).length} constructions</span>
          </div>

          <div className="space-y-3">
            {Object.entries(fabricTypeMap).map(([type, weight]) => {
              const pct = Math.round((weight / (stats.totalInStockKg || 1)) * 100);
              return (
                <div key={type}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-800">{type}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {weight.toFixed(1)} KG <span className="text-[11px] text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-800 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buyer Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Stock Breakdown by Buyer Account
            </h3>
            <span className="text-xs font-mono text-slate-500">{Object.keys(buyerMap).length} buyers</span>
          </div>

          <div className="space-y-3">
            {Object.entries(buyerMap).map(([buyer, weight]) => {
              const pct = Math.round((weight / (stats.totalInStockKg || 1)) * 100);
              return (
                <div key={buyer}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-800">{buyer}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {weight.toFixed(1)} KG <span className="text-[11px] text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-700 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity Grid: Receipts vs Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Receives */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackagePlus className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Recent Fabric Receives (MRR / GRN)
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('receive')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              View All &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentReceives.length === 0 ? (
              <div className="p-6 text-center text-slate-400">No receipts logged yet.</div>
            ) : (
              recentReceives.map(rcv => (
                <div key={rcv.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono">{rcv.challanNo}</span>
                      <span className="text-[11px] font-mono text-blue-700 font-bold">{rcv.poNumber}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {rcv.buyer} · {rcv.style} · {rcv.rolls.length} rolls
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-slate-900">{rcv.totalWeight.toFixed(1)} KG</div>
                    <div className="text-[10px] text-slate-400 font-sans">{rcv.receivingDate}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Issues */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Recent Cutting Room Dispatches
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('issue')}
              className="text-xs text-amber-800 hover:text-amber-950 font-semibold"
            >
              View All &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentIssues.length === 0 ? (
              <div className="p-6 text-center text-slate-400">No cutting issues logged yet.</div>
            ) : (
              recentIssues.map(iss => (
                <div key={iss.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono">{iss.issueSlipNo}</span>
                      <span className="text-[11px] font-mono text-blue-700 font-bold">{iss.poNumber}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Issued to <span className="font-medium text-slate-700">{iss.issuedTo}</span> · {iss.rollsCount} rolls
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-amber-900">{iss.totalIssuedWeight.toFixed(1)} KG</div>
                    <div className="text-[10px] text-slate-400 font-sans">{iss.issueDate}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
