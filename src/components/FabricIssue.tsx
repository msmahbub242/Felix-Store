import React, { useState, useEffect } from 'react';
import { useFabricStore } from '../context/FabricStoreContext';
import { FabricIssueRecord, FabricRoll, ROLE_LABELS } from '../types/fabric';
import {
  ArrowUpRight,
  Search,
  CheckSquare,
  Square,
  Scissors,
  CheckCircle2,
  FileText,
  Printer,
  AlertCircle,
  Building,
  Info,
} from 'lucide-react';
import { IssueSlipModal } from './IssueSlipModal';

interface FabricIssueProps {
  initialPoNumber?: string;
}

interface IssueItemState {
  rollId: string;
  selected: boolean;
  issueWeight: number;
}

export const FabricIssue: React.FC<FabricIssueProps> = ({ initialPoNumber }) => {
  const {
    pos,
    rolls,
    issues,
    getPOByNumber,
    getAvailableRollsForPO,
    createIssue,
    currentUser,
    hasPermission,
  } = useFabricStore();

  const canIssue = hasPermission('canIssueFabric');

  const [activeSubTab, setActiveSubTab] = useState<'new-issue' | 'issue-history'>('new-issue');

  // Selected PO to call
  const [selectedPoNumber, setSelectedPoNumber] = useState(
    initialPoNumber || (pos.length > 0 ? pos[0].poNumber : '')
  );

  const selectedPO = getPOByNumber(selectedPoNumber);

  // Issue Header fields
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [issueSlipNo, setIssueSlipNo] = useState(`ISS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [issuedTo, setIssuedTo] = useState('Cutting Table #01 (Master Kabir)');
  const [issuedBy, setIssuedBy] = useState(
    `${currentUser.name} (${ROLE_LABELS[currentUser.role].label})`
  );
  const [purpose, setPurpose] = useState('Bulk Production Cutting - Marker Lay #1');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    setIssuedBy(`${currentUser.name} (${ROLE_LABELS[currentUser.role].label})`);
  }, [currentUser]);

  // Available rolls for this PO
  const availableRolls = getAvailableRollsForPO(selectedPoNumber);

  // Issue state mapped by rollId
  const [issueMap, setIssueMap] = useState<Record<string, { selected: boolean; issueWeight: number }>>({});

  // View modal for created or historical issue slip
  const [viewingIssue, setViewingIssue] = useState<FabricIssueRecord | null>(null);

  // Toggle selection of a roll
  const handleToggleRoll = (roll: FabricRoll) => {
    setIssueMap(prev => {
      const current = prev[roll.id] || { selected: false, issueWeight: roll.currentWeight };
      const nextSelected = !current.selected;
      return {
        ...prev,
        [roll.id]: {
          selected: nextSelected,
          // When selected, default to full roll weight if not set
          issueWeight: current.issueWeight > 0 ? current.issueWeight : roll.currentWeight,
        },
      };
    });
  };

  // Select all available rolls
  const handleSelectAll = (select: boolean) => {
    const updated: Record<string, { selected: boolean; issueWeight: number }> = {};
    availableRolls.forEach(roll => {
      const existing = issueMap[roll.id];
      updated[roll.id] = {
        selected: select,
        issueWeight: existing?.issueWeight || roll.currentWeight,
      };
    });
    setIssueMap(updated);
  };

  // Change issue weight for a roll (partial or full)
  const handleWeightChange = (rollId: string, maxWeight: number, val: number) => {
    const clamped = Math.max(0, Math.min(val, maxWeight));
    setIssueMap(prev => ({
      ...prev,
      [rollId]: {
        selected: prev[rollId]?.selected ?? true,
        issueWeight: clamped,
      },
    }));
  };

  // Set to full roll weight
  const handleSetFullRoll = (roll: FabricRoll) => {
    setIssueMap(prev => ({
      ...prev,
      [roll.id]: {
        selected: true,
        issueWeight: roll.currentWeight,
      },
    }));
  };

  // Selected rolls summary
  const selectedItemsToIssue = availableRolls.filter(r => issueMap[r.id]?.selected && (issueMap[r.id]?.issueWeight || 0) > 0);
  const totalIssueWeight = selectedItemsToIssue.reduce(
    (sum, r) => sum + (issueMap[r.id]?.issueWeight || 0),
    0
  );

  const handleSubmitIssue = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPoNumber) {
      alert('Please select a Purchase Order.');
      return;
    }

    if (selectedItemsToIssue.length === 0) {
      alert('Please select at least one roll with issue weight > 0.');
      return;
    }

    // Validate weights
    for (const roll of selectedItemsToIssue) {
      const reqWeight = issueMap[roll.id]?.issueWeight || 0;
      if (reqWeight <= 0 || reqWeight > roll.currentWeight + 0.001) {
        alert(`Invalid weight for Roll ${roll.rollNo}. Available: ${roll.currentWeight} KG, Requested: ${reqWeight} KG`);
        return;
      }
    }

    const newIssue = createIssue(
      {
        issueDate,
        issueSlipNo,
        poNumber: selectedPoNumber,
        issuedTo,
        issuedBy,
        purpose,
        remarks,
      },
      selectedItemsToIssue.map(r => ({
        rollId: r.id,
        weightToIssue: issueMap[r.id].issueWeight,
      }))
    );

    setViewingIssue(newIssue);

    // Reset selection and slip number
    setIssueMap({});
    setIssueSlipNo(`ISS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setRemarks('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Fabric Store Issuance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch fabric rolls to cutting room by PO with full or partial weight deduction and automated stock ledger tracking.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveSubTab('new-issue')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'new-issue'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New Issue Entry
          </button>
          <button
            onClick={() => setActiveSubTab('issue-history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'issue-history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Issue Slip History ({issues.length})
          </button>
        </div>
      </div>

      {!canIssue && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <span className="font-bold">Viewing / Requisition Mode:</span> Signed in as{' '}
              <span className="font-semibold">{currentUser.name}</span> ({ROLE_LABELS[currentUser.role].label}).
              Authorizing fabric dispatches to cutting floor requires Store In-Charge or Master Admin role permissions.
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'issue-history' ? (
        /* Issue History Tab */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Past Cutting Dispatches &amp; Requisitions
            </h3>
            <span className="text-xs text-slate-500">{issues.length} slips issued</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Issue Date</th>
                  <th className="py-2.5 px-4">Slip No</th>
                  <th className="py-2.5 px-4">PO Number</th>
                  <th className="py-2.5 px-4">Buyer & Style</th>
                  <th className="py-2.5 px-4">Issued To</th>
                  <th className="py-2.5 px-4">Purpose</th>
                  <th className="py-2.5 px-4 text-center">Rolls</th>
                  <th className="py-2.5 px-4 text-right">Total Weight</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {issues.map(iss => (
                  <tr key={iss.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 text-slate-600">{iss.issueDate}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{iss.issueSlipNo}</td>
                    <td className="py-3 px-4 text-blue-700 font-bold">{iss.poNumber}</td>
                    <td className="py-3 px-4 font-sans text-slate-800">
                      <div className="font-semibold">{iss.buyer}</div>
                      <div className="text-[11px] text-slate-500">{iss.style}</div>
                    </td>
                    <td className="py-3 px-4 font-sans text-amber-900 font-medium">{iss.issuedTo}</td>
                    <td className="py-3 px-4 font-sans text-slate-600 truncate max-w-[160px]">{iss.purpose}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{iss.rollsCount}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-900">{iss.totalIssuedWeight.toFixed(2)} KG</td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => setViewingIssue(iss)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Print Slip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* New Issue Form */
        <form onSubmit={handleSubmitIssue} className="space-y-6">
          {/* Step 1: Call by PO */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Scissors className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                1. Call By Purchase Order (PO)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Call by PO Number <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedPoNumber}
                  onChange={e => {
                    setSelectedPoNumber(e.target.value);
                    setIssueMap({});
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono font-bold text-slate-900"
                >
                  <option value="">-- Select PO to Call Fabric --</option>
                  {pos.map(po => {
                    const poRollsCount = getAvailableRollsForPO(po.poNumber).length;
                    return (
                      <option key={po.id} value={po.poNumber}>
                        {po.poNumber} — {po.buyer} ({poRollsCount} rolls available)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Issue Slip Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={issueSlipNo}
                  onChange={e => setIssueSlipNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Issue Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Issued To (Destination / Table) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={issuedTo}
                  onChange={e => setIssuedTo(e.target.value)}
                  placeholder="e.g. Cutting Table #01"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Issued By (Store Officer)
                </label>
                <input
                  type="text"
                  value={issuedBy}
                  onChange={e => setIssuedBy(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Purpose / Cutting Marker Lay Ref
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="e.g. Production Cutting Lay #1, Sample test, Shrinkage test"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="e.g. Balance rolls returned to rack after cut"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Selected PO Specs */}
            {selectedPO && (
              <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div>
                    <span className="text-amber-700 block text-[10px] uppercase font-bold">Buyer</span>
                    <span className="font-semibold text-slate-900">{selectedPO.buyer}</span>
                  </div>
                  <div>
                    <span className="text-amber-700 block text-[10px] uppercase font-bold">Style Ref</span>
                    <span className="font-semibold text-slate-900">{selectedPO.style}</span>
                  </div>
                  <div>
                    <span className="text-amber-700 block text-[10px] uppercase font-bold">Fabric Specification</span>
                    <span className="font-medium text-slate-900">{selectedPO.item}</span>
                  </div>
                </div>

                <div className="bg-white px-3 py-1.5 rounded-md border border-amber-300 text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Available Stock in Store</div>
                  <div className="text-xs font-bold font-mono text-slate-900">
                    <span className="text-amber-800 font-black">{availableRolls.length} Rolls</span> (
                    {availableRolls.reduce((sum, r) => sum + r.currentWeight, 0).toFixed(1)} KG)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Available Roll Data against PO */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  2. Available Rolls for {selectedPoNumber || 'Selected PO'} ({availableRolls.length} rolls in rack)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select rolls by checkbox. Enter full or partial quantity to issue.
                </p>
              </div>

              {availableRolls.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100"
                  >
                    Deselect All
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">Select</th>
                    <th className="py-2.5 px-3">Roll Serial No</th>
                    <th className="py-2.5 px-3">Color</th>
                    <th className="py-2.5 px-3">Lot No</th>
                    <th className="py-2.5 px-3">GSM / Width</th>
                    <th className="py-2.5 px-3">Rack No</th>
                    <th className="py-2.5 px-3">QC Status</th>
                    <th className="py-2.5 px-3 text-right">Available Weight</th>
                    <th className="py-2.5 px-3 text-center">Issue Weight (KG) *</th>
                    <th className="py-2.5 px-3 text-right">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {availableRolls.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        {selectedPoNumber
                          ? `No available fabric rolls found for ${selectedPoNumber} (all rolls either exhausted or zero balance).`
                          : 'Please select a PO above to call available rolls.'}
                      </td>
                    </tr>
                  ) : (
                    availableRolls.map(roll => {
                      const isSelected = !!issueMap[roll.id]?.selected;
                      const issueWeight = issueMap[roll.id]?.issueWeight ?? roll.currentWeight;
                      const remainingWeight = Math.max(0, Math.round((roll.currentWeight - issueWeight) * 100) / 100);

                      return (
                        <tr
                          key={roll.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-amber-50/60' : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleRoll(roll)}
                              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                            />
                          </td>

                          {/* Roll No */}
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">
                            {roll.rollNo}
                            {roll.stockStatus === 'Partially Issued' && (
                              <span className="block text-[10px] text-amber-700 font-sans font-normal">
                                (Partially cut)
                              </span>
                            )}
                          </td>

                          {/* Color */}
                          <td className="py-2 px-3 font-medium text-slate-800">{roll.color}</td>

                          {/* Lot No */}
                          <td className="py-2 px-3 font-mono text-slate-600">{roll.lotNo}</td>

                          {/* GSM / Width */}
                          <td className="py-2 px-3 text-slate-600">{roll.gsm} / {roll.width}</td>

                          {/* Rack No */}
                          <td className="py-2 px-3 font-semibold text-slate-700">{roll.rackNo}</td>

                          {/* QC Status */}
                          <td className="py-2 px-3">
                            <span
                              className={`text-[11px] font-medium ${
                                roll.qualityStatus === 'Approved'
                                  ? 'text-emerald-700'
                                  : roll.qualityStatus === 'Under QC'
                                  ? 'text-amber-700'
                                  : 'text-red-700'
                              }`}
                            >
                              {roll.qualityStatus}
                            </span>
                          </td>

                          {/* Available Weight */}
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {roll.currentWeight.toFixed(2)} KG
                          </td>

                          {/* Issue Weight Input (Full or Partial Qty) */}
                          <td className="py-2 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max={roll.currentWeight}
                                disabled={!isSelected}
                                value={isSelected ? issueWeight : ''}
                                placeholder={roll.currentWeight.toFixed(1)}
                                onChange={e =>
                                  handleWeightChange(roll.id, roll.currentWeight, Number(e.target.value))
                                }
                                className={`w-20 px-2 py-1 text-xs font-mono font-bold text-right rounded border transition-colors ${
                                  isSelected
                                    ? 'bg-white border-amber-400 text-slate-900 focus:ring-1 focus:ring-amber-500'
                                    : 'bg-slate-100 border-slate-200 text-slate-400'
                                }`}
                              />
                              <button
                                type="button"
                                disabled={!isSelected}
                                onClick={() => handleSetFullRoll(roll)}
                                title="Issue Full Roll"
                                className="px-1.5 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded disabled:opacity-30 whitespace-nowrap"
                              >
                                Full
                              </button>
                            </div>
                          </td>

                          {/* Remaining balance preview */}
                          <td className="py-2 px-3 text-right font-mono">
                            {isSelected ? (
                              <span
                                className={`font-semibold ${
                                  remainingWeight <= 0 ? 'text-slate-400' : 'text-emerald-700'
                                }`}
                              >
                                {remainingWeight <= 0 ? '0.00 (Exhausted)' : `${remainingWeight.toFixed(2)} KG`}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t border-slate-200 text-slate-900 font-mono">
                  <tr>
                    <td colSpan={7} className="py-3 px-3 text-right font-sans">
                      Selected for Dispatch:
                    </td>
                    <td colSpan={3} className="py-3 px-3 text-right text-amber-900 text-sm">
                      {selectedItemsToIssue.length} Rolls Selected · {totalIssueWeight.toFixed(2)} KG Total Dispatch
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Bottom Dispatch Action Bar */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{selectedItemsToIssue.length} Rolls</span> will be issued to{' '}
              <span className="font-semibold text-slate-900">{issuedTo}</span> for {selectedPoNumber}.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={selectedItemsToIssue.length === 0 || !canIssue}
                title={!canIssue ? 'Store In-Charge or Master Admin permission required to issue fabric' : undefined}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
              >
                <Scissors className="w-4 h-4 text-amber-400" />
                <span>Authorize &amp; Issue Fabric to Cutting</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Printable Issue Slip Modal */}
      {viewingIssue && (
        <IssueSlipModal
          issue={viewingIssue}
          onClose={() => setViewingIssue(null)}
        />
      )}
    </div>
  );
};
