import React, { useState } from 'react';
import { useFabricStore } from '../context/FabricStoreContext';
import { FabricRoll } from '../types/fabric';
import {
  Clock,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  Layers,
  ArrowRight,
  Download,
  Printer,
  Mail,
  Tag,
  Search,
} from 'lucide-react';
import { RollLabelModal } from './RollLabelModal';

export const SlowMovingReport: React.FC = () => {
  const { rolls, pos } = useFabricStore();

  const [thresholdDays, setThresholdDays] = useState<number>(60);
  const [selectedBuyer, setSelectedBuyer] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRollForTag, setSelectedRollForTag] = useState<FabricRoll | null>(null);

  const now = new Date();

  // Helper to calculate age in days
  const getRollAgeDays = (receiveDate: string) => {
    const rcv = new Date(receiveDate);
    const diffTime = Math.abs(now.getTime() - rcv.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Only consider rolls that currently have fabric balance in store (>0 KG)
  const activeRollsWithAge = rolls
    .filter(r => r.currentWeight > 0.001)
    .map(r => ({
      ...r,
      ageDays: getRollAgeDays(r.receiveDate),
    }));

  // Aging tiers
  const tier30 = activeRollsWithAge.filter(r => r.ageDays <= 30);
  const tier60 = activeRollsWithAge.filter(r => r.ageDays > 30 && r.ageDays <= 60);
  const tier90 = activeRollsWithAge.filter(r => r.ageDays > 60 && r.ageDays <= 90);
  const tierDead = activeRollsWithAge.filter(r => r.ageDays > 90);

  // Filtered by active threshold
  const slowRolls = activeRollsWithAge.filter(r => {
    const matchesThreshold = r.ageDays >= thresholdDays;
    const matchesBuyer = selectedBuyer === 'ALL' || r.buyer === selectedBuyer;
    const matchesSearch =
      r.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.item.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesThreshold && matchesBuyer && matchesSearch;
  });

  const totalSlowWeight = slowRolls.reduce((sum, r) => sum + r.currentWeight, 0);
  const estimatedTiedCapital = Math.round(totalSlowWeight * 6.5); // ~$6.50/kg garment fabric benchmark

  const buyers = Array.from(new Set(activeRollsWithAge.map(r => r.buyer))).filter(Boolean);

  const handleExportSlowCSV = () => {
    const headers = [
      'Roll No',
      'PO Number',
      'Age (Days)',
      'Receive Date',
      'Buyer',
      'Style',
      'Fabric Item',
      'Color',
      'Lot No',
      'Rack No',
      'In-Store Balance (KG)',
      'Quality Status',
      'Aging Status',
    ];

    const rows = slowRolls.map(r => [
      `"${r.rollNo}"`,
      `"${r.poNumber}"`,
      r.ageDays,
      `"${r.receiveDate}"`,
      `"${r.buyer}"`,
      `"${r.style}"`,
      `"${r.item.replace(/"/g, '""')}"`,
      `"${r.color}"`,
      `"${r.lotNo}"`,
      `"${r.rackNo}"`,
      r.currentWeight.toFixed(2),
      `"${r.qualityStatus}"`,
      r.ageDays > 90 ? '"Stagnant (>90d)"' : '"Slow Moving (60-90d)"',
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `slow_moving_fabric_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Slow-Moving Fabric Stock Analyzer</h1>
          <p className="text-xs text-slate-500 mt-1">
            Identify stagnant fabric inventory aged &gt;30, &gt;60, and &gt;90 days to prevent capital lockup and fabric degradation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportSlowCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Aging Audit</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Aging Tiers Summary Strips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Tier 1: Fresh */}
        <div
          onClick={() => setThresholdDays(0)}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            thresholdDays === 0
              ? 'bg-emerald-50/50 border-emerald-400 ring-1 ring-emerald-400'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Fresh Active Stock</span>
            <span className="font-mono text-emerald-700 font-bold">&le; 30 Days</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {tier30.reduce((s, r) => s + r.currentWeight, 0).toFixed(1)} <span className="text-xs font-normal text-slate-500">KG</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{tier30.length} rolls in rack</div>
        </div>

        {/* Tier 2: Normal Transition */}
        <div
          onClick={() => setThresholdDays(31)}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            thresholdDays === 31
              ? 'bg-blue-50/50 border-blue-400 ring-1 ring-blue-400'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Moderate Aging</span>
            <span className="font-mono text-blue-700 font-bold">31 - 60 Days</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {tier60.reduce((s, r) => s + r.currentWeight, 0).toFixed(1)} <span className="text-xs font-normal text-slate-500">KG</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{tier60.length} rolls in rack</div>
        </div>

        {/* Tier 3: Slow Moving */}
        <div
          onClick={() => setThresholdDays(60)}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            thresholdDays === 60
              ? 'bg-amber-50/50 border-amber-400 ring-1 ring-amber-400'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Slow Moving
            </span>
            <span className="font-mono">61 - 90 Days</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900 mt-2">
            {tier90.reduce((s, r) => s + r.currentWeight, 0).toFixed(1)} <span className="text-xs font-normal text-slate-500">KG</span>
          </div>
          <div className="text-[11px] text-amber-700 mt-1">{tier90.length} rolls in watch-list</div>
        </div>

        {/* Tier 4: Dead Stock */}
        <div
          onClick={() => setThresholdDays(90)}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            thresholdDays === 90
              ? 'bg-red-50/50 border-red-400 ring-1 ring-red-400'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-red-700 font-bold">
            <span className="flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5 text-red-600" /> Stagnant / Dead Stock
            </span>
            <span className="font-mono">&gt; 90 Days</span>
          </div>
          <div className="text-2xl font-bold font-mono text-red-700 mt-2">
            {tierDead.reduce((s, r) => s + r.currentWeight, 0).toFixed(1)} <span className="text-xs font-normal text-slate-500">KG</span>
          </div>
          <div className="text-[11px] text-red-600 font-medium mt-1">{tierDead.length} rolls locked &gt;3 months</div>
        </div>
      </div>

      {/* Executive Impact Summary */}
      <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold">
              Active Filter: Inventory Aged &ge; {thresholdDays} Days
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Affecting <span className="font-bold text-white">{slowRolls.length} Rolls</span> ({totalSlowWeight.toFixed(1)} KG)
              across {Array.from(new Set(slowRolls.map(r => r.poNumber))).length} Purchase Orders.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-right font-mono">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-sans">Tied Fabric Capital (Est.)</div>
            <div className="text-lg font-bold text-amber-400">${estimatedTiedCapital.toLocaleString()} USD</div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roll, PO, color, fabric..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-slate-500 whitespace-nowrap">Filter by Buyer:</span>
          <select
            value={selectedBuyer}
            onChange={e => setSelectedBuyer(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
          >
            <option value="ALL">All Buyers</option>
            {buyers.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Slow Moving Rolls Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Slow Moving &amp; Aging Fabric Roll Manifest
          </h3>
          <span className="text-xs text-slate-500 font-mono">{slowRolls.length} rolls listed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 font-sans">
              <tr>
                <th className="py-2.5 px-3">Roll No</th>
                <th className="py-2.5 px-3">PO Number</th>
                <th className="py-2.5 px-3">Buyer</th>
                <th className="py-2.5 px-3">Color</th>
                <th className="py-2.5 px-3">Lot No</th>
                <th className="py-2.5 px-3">Rack</th>
                <th className="py-2.5 px-3">Received On</th>
                <th className="py-2.5 px-3 text-center">Days in Store</th>
                <th className="py-2.5 px-3 text-right">Balance (KG)</th>
                <th className="py-2.5 px-3 text-center font-sans">Aging Severity</th>
                <th className="py-2.5 px-3 text-right font-sans">Tag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slowRolls.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 font-sans">
                    No fabric rolls currently exceed the {thresholdDays}-day aging threshold.
                  </td>
                </tr>
              ) : (
                slowRolls.map(roll => {
                  const isStagnant = roll.ageDays > 90;
                  return (
                    <tr key={roll.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{roll.rollNo}</td>
                      <td className="py-2 px-3 font-bold text-blue-700">{roll.poNumber}</td>
                      <td className="py-2 px-3 font-sans text-slate-700">{roll.buyer}</td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-800">{roll.color}</td>
                      <td className="py-2 px-3 text-slate-600">{roll.lotNo}</td>
                      <td className="py-2 px-3 font-semibold text-slate-700 font-sans">{roll.rackNo}</td>
                      <td className="py-2 px-3 text-slate-500">{roll.receiveDate}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`font-bold ${isStagnant ? 'text-red-700' : 'text-amber-800'}`}>
                          {roll.ageDays} Days
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {roll.currentWeight.toFixed(2)} KG
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isStagnant
                              ? 'bg-red-50 text-red-800 border border-red-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isStagnant ? 'Dead Stock' : 'Slow Moving'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-sans">
                        <button
                          onClick={() => setSelectedRollForTag(roll)}
                          title="Print Roll Tag"
                          className="p-1 text-slate-400 hover:text-slate-800"
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Label Modal */}
      {selectedRollForTag && (
        <RollLabelModal roll={selectedRollForTag} onClose={() => setSelectedRollForTag(null)} />
      )}
    </div>
  );
};
