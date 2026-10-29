import React, { useState } from 'react';
import { useFabricStore } from '../context/FabricStoreContext';
import { WarehouseRack, FabricRoll } from '../types/fabric';
import {
  Grid3X3,
  Layers,
  ArrowRightLeft,
  Plus,
  X,
  Package,
  Info,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { RollLabelModal } from './RollLabelModal';

export const RackManagement: React.FC = () => {
  const { racks, rolls, addRack, transferRollRack, hasPermission } = useFabricStore();
  const canManageRacks = hasPermission('canManageRacks');

  const [selectedRack, setSelectedRack] = useState<WarehouseRack | null>(racks[0] || null);
  const [isAddRackModalOpen, setIsAddRackModalOpen] = useState(false);
  const [transferModalRoll, setTransferModalRoll] = useState<FabricRoll | null>(null);
  const [targetRackNo, setTargetRackNo] = useState(racks[0]?.name || '');
  const [labelRoll, setLabelRoll] = useState<FabricRoll | null>(null);

  // New Rack Form
  const [newRackName, setNewRackName] = useState('');
  const [newRackZone, setNewRackZone] = useState('Zone A - Single Jersey');
  const [newRackCapacity, setNewRackCapacity] = useState(2500);
  const [newRackMaxRolls, setNewRackMaxRolls] = useState(100);

  const handleAddRackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRackName.trim()) return;

    addRack({
      id: `rack-${Date.now()}`,
      name: newRackName,
      zone: newRackZone,
      aisle: 'Aisle 1',
      tier: 'Level 1-3',
      capacityKg: newRackCapacity,
      maxRolls: newRackMaxRolls,
    });

    setIsAddRackModalOpen(false);
    setNewRackName('');
  };

  const handleExecuteTransfer = () => {
    if (!transferModalRoll || !targetRackNo) return;
    transferRollRack(transferModalRoll.id, targetRackNo);
    setTransferModalRoll(null);
  };

  // Rolls in the selected rack with current balance
  const activeRackRolls = rolls.filter(
    r => selectedRack && r.rackNo === selectedRack.name && r.currentWeight > 0.001
  );
  const totalWeightInSelectedRack = activeRackRolls.reduce((sum, r) => sum + r.currentWeight, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Warehouse Rack &amp; Location Control</h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor real-time rack occupancy, transfer rolls between warehouse bins, and manage physical storage zones.
          </p>
        </div>

        <button
          onClick={() => {
            setNewRackName(`Rack E-${Math.floor(10 + Math.random() * 90)}`);
            setIsAddRackModalOpen(true);
          }}
          disabled={!canManageRacks}
          title={!canManageRacks ? 'Only Master Admin and Store In-Charge can create storage racks' : 'Add Storage Rack'}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors ${
            canManageRacks
              ? 'text-white bg-slate-900 hover:bg-slate-800'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4 text-blue-400" />
          <span>Add Storage Rack</span>
        </button>
      </div>

      {/* Rack Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {racks.map(rack => {
          const rackRolls = rolls.filter(r => r.rackNo === rack.name && r.currentWeight > 0.001);
          const currentWeight = rackRolls.reduce((sum, r) => sum + r.currentWeight, 0);
          const utilizationPct = Math.min(100, Math.round((currentWeight / rack.capacityKg) * 100));
          const isSelected = selectedRack?.id === rack.id;

          return (
            <div
              key={rack.id}
              onClick={() => setSelectedRack(rack)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-white border-slate-900 ring-2 ring-slate-900/10 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-slate-900 text-base">{rack.name}</span>
                <span className="text-xs font-mono font-bold text-slate-600">{utilizationPct}%</span>
              </div>

              <div className="text-[11px] text-slate-500 truncate mb-3">{rack.zone}</div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full transition-all duration-300 ${
                    utilizationPct >= 85
                      ? 'bg-amber-600'
                      : utilizationPct >= 50
                      ? 'bg-blue-600'
                      : 'bg-slate-700'
                  }`}
                  style={{ width: `${utilizationPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-700 pt-2 border-t border-slate-100">
                <span>{currentWeight.toFixed(1)} / {rack.capacityKg} KG</span>
                <span>{rackRolls.length} Rolls</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Rack Content Manifest */}
      {selectedRack && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-slate-700" />
                <h3 className="font-bold text-sm text-slate-900">
                  {selectedRack.name} Storage Manifest
                </h3>
                <span className="text-xs text-slate-500 font-mono">({selectedRack.zone})</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeRackRolls.length} active rolls · Total Weight: {totalWeightInSelectedRack.toFixed(1)} KG
              </p>
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Max Capacity: {selectedRack.capacityKg} KG ({selectedRack.maxRolls} rolls max)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 font-sans">
                <tr>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">PO Number</th>
                  <th className="py-2.5 px-3">Buyer &amp; Style</th>
                  <th className="py-2.5 px-3 font-medium">Color</th>
                  <th className="py-2.5 px-3">Lot No</th>
                  <th className="py-2.5 px-3">GSM / Width</th>
                  <th className="py-2.5 px-3 text-right">Available Weight</th>
                  <th className="py-2.5 px-3 text-center">QC Status</th>
                  <th className="py-2.5 px-3 text-right font-sans">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeRackRolls.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                      This rack currently has no active fabric rolls.
                    </td>
                  </tr>
                ) : (
                  activeRackRolls.map(roll => (
                    <tr key={roll.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{roll.rollNo}</td>
                      <td className="py-2 px-3 font-bold text-blue-700">{roll.poNumber}</td>
                      <td className="py-2 px-3 font-sans text-slate-700">
                        {roll.buyer} · {roll.style}
                      </td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-800">{roll.color}</td>
                      <td className="py-2 px-3 text-slate-600">{roll.lotNo}</td>
                      <td className="py-2 px-3 text-slate-600">{roll.gsm} / {roll.width}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">
                        {roll.currentWeight.toFixed(2)} KG
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span className="text-[10px] font-medium text-slate-700">{roll.qualityStatus}</span>
                      </td>
                      <td className="py-2 px-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setTransferModalRoll(roll);
                              setTargetRackNo(
                                racks.find(r => r.name !== roll.rackNo)?.name || racks[0].name
                              );
                            }}
                            disabled={!canManageRacks}
                            title={!canManageRacks ? 'Rack management permission required to move rolls' : 'Transfer Roll Location'}
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded transition-colors ${
                              canManageRacks
                                ? 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
                                : 'text-slate-300 bg-slate-50 cursor-not-allowed'
                            }`}
                          >
                            <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                            <span>Transfer</span>
                          </button>
                          <button
                            onClick={() => setLabelRoll(roll)}
                            title="Print Roll Tag"
                            className="p-1 text-slate-400 hover:text-slate-700"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transfer Roll Modal */}
      {transferModalRoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-slate-700" />
                <h3 className="font-semibold text-slate-900">Transfer Roll Rack Location</h3>
              </div>
              <button
                onClick={() => setTransferModalRoll(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 font-mono">
                <div>
                  <span className="text-slate-400 font-sans">Roll:</span>{' '}
                  <span className="font-bold text-slate-900">{transferModalRoll.rollNo}</span> ({transferModalRoll.poNumber})
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Color / Lot:</span>{' '}
                  <span className="text-slate-800">{transferModalRoll.color} · {transferModalRoll.lotNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Weight:</span>{' '}
                  <span className="font-bold text-emerald-700">{transferModalRoll.currentWeight} KG</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans">Current Rack:</span>{' '}
                  <span className="font-bold text-blue-700">{transferModalRoll.rackNo}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Target Rack
                </label>
                <select
                  value={targetRackNo}
                  onChange={e => setTargetRackNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                >
                  {racks.map(rk => (
                    <option key={rk.id} value={rk.name}>
                      {rk.name} ({rk.zone})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => setTransferModalRoll(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteTransfer}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Rack Modal */}
      {isAddRackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-900">Add New Storage Rack</h3>
              <button
                onClick={() => setIsAddRackModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRackSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rack Name / Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rack E-01"
                  value={newRackName}
                  onChange={e => setNewRackName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Storage Zone Classification
                </label>
                <input
                  type="text"
                  value={newRackZone}
                  onChange={e => setNewRackZone(e.target.value)}
                  placeholder="e.g. Zone A - Single Jersey"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Capacity (KG)
                  </label>
                  <input
                    type="number"
                    min={100}
                    value={newRackCapacity}
                    onChange={e => setNewRackCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Rolls
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={newRackMaxRolls}
                    onChange={e => setNewRackMaxRolls(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddRackModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Create Rack
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Label Modal */}
      {labelRoll && <RollLabelModal roll={labelRoll} onClose={() => setLabelRoll(null)} />}
    </div>
  );
};
