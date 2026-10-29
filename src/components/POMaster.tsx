import React, { useState } from 'react';
import { useFabricStore } from '../context/FabricStoreContext';
import { PurchaseOrder } from '../types/fabric';
import {
  Plus,
  Search,
  FileSpreadsheet,
  PackagePlus,
  ArrowUpRight,
  Eye,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Layers,
  Calendar,
} from 'lucide-react';

interface POMasterProps {
  onNavigateToReceive: (poNumber: string) => void;
  onNavigateToIssue: (poNumber: string) => void;
}

export const POMaster: React.FC<POMasterProps> = ({ onNavigateToReceive, onNavigateToIssue }) => {
  const { pos, rolls, receives, issues, addPO, updatePO, deletePO, hasPermission, currentUser } =
    useFabricStore();

  const canManagePOs = hasPermission('canManagePOs');
  const canDeleteRecords = hasPermission('canDeleteRecords');

  const [searchQuery, setSearchQuery] = useState('');
  const [buyerFilter, setBuyerFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);

  // New PO form state
  const [formData, setFormData] = useState({
    poNumber: '',
    style: '',
    buyer: '',
    item: '',
    orderQty: 2500,
    unit: 'KG' as 'KG' | 'YARDS',
    season: 'Autumn/Winter 2026',
    supplier: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Pending' as PurchaseOrder['status'],
    remarks: '',
  });

  const buyers = Array.from(new Set(pos.map(p => p.buyer))).filter(Boolean);

  // Filtered PO list
  const filteredPOs = pos.filter(po => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.style.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplier.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBuyer = buyerFilter === 'ALL' || po.buyer === buyerFilter;
    const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;

    return matchesSearch && matchesBuyer && matchesStatus;
  });

  const handleOpenCreateModal = () => {
    setEditingPO(null);
    setFormData({
      poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      style: '',
      buyer: '',
      item: '',
      orderQty: 2500,
      unit: 'KG',
      season: 'Spring/Summer 2026',
      supplier: '',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      remarks: '',
    });
    setIsNewPOModalOpen(true);
  };

  const handleOpenEditModal = (po: PurchaseOrder) => {
    setEditingPO(po);
    setFormData({
      poNumber: po.poNumber,
      style: po.style,
      buyer: po.buyer,
      item: po.item,
      orderQty: po.orderQty,
      unit: po.unit,
      season: po.season,
      supplier: po.supplier,
      orderDate: po.orderDate,
      deliveryDate: po.deliveryDate,
      status: po.status,
      remarks: po.remarks || '',
    });
    setIsNewPOModalOpen(true);
  };

  const handleSubmitPO = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.poNumber.trim() || !formData.style.trim() || !formData.buyer.trim() || !formData.item.trim()) {
      alert('Please fill in all mandatory fields (PO, Style, Buyer, Item).');
      return;
    }

    if (editingPO) {
      updatePO(editingPO.id, formData);
    } else {
      // Check duplicate
      const duplicate = pos.some(
        p => p.poNumber.trim().toLowerCase() === formData.poNumber.trim().toLowerCase()
      );
      if (duplicate) {
        alert(`PO Number "${formData.poNumber}" already exists! Please use a unique PO Number.`);
        return;
      }
      addPO(formData);
    }

    setIsNewPOModalOpen(false);
  };

  // Helper stats for POs
  const getPOStats = (poNumber: string) => {
    const poRolls = rolls.filter(r => r.poNumber.toLowerCase() === poNumber.toLowerCase());
    const totalReceivedKg = poRolls.reduce((sum, r) => sum + r.originalWeight, 0);
    const inStockKg = poRolls.reduce((sum, r) => sum + r.currentWeight, 0);
    const activeRollsCount = poRolls.filter(r => r.currentWeight > 0.001).length;
    return {
      totalRolls: poRolls.length,
      activeRolls: activeRollsCount,
      totalReceivedKg: Math.round(totalReceivedKg * 10) / 10,
      inStockKg: Math.round(inStockKg * 10) / 10,
      issuedKg: Math.round((totalReceivedKg - inStockKg) * 10) / 10,
    };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Purchase Order (PO) Master</h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain factory purchase orders, buyer specifications, fabric items, and fulfillment tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreateModal}
            disabled={!canManagePOs}
            title={!canManagePOs ? 'Only Master Admin and Store In-Charge can create Purchase Orders' : 'Create New PO'}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors ${
              canManagePOs
                ? 'text-white bg-slate-900 hover:bg-slate-800'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>Create New PO</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total POs Created</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{pos.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {pos.filter(p => p.status === 'Receiving').length} In-Receiving · {pos.filter(p => p.status === 'Pending').length} Pending
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Booked Fabric Qty</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {pos.reduce((sum, p) => sum + p.orderQty, 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">KG</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across all buyer purchase orders</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Fabric Received</div>
          <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
            {rolls.reduce((sum, r) => sum + r.originalWeight, 0).toFixed(1)} <span className="text-xs font-normal text-slate-500">KG</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{rolls.length} Rolls received to date</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current Stock Balance</div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {rolls.reduce((sum, r) => sum + r.currentWeight, 0).toFixed(1)} <span className="text-xs font-normal text-slate-500">KG</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {rolls.filter(r => r.currentWeight > 0.001).length} active rolls in racks
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search PO, style, buyer, item, supplier..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={buyerFilter}
            onChange={e => setBuyerFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-700"
          >
            <option value="ALL">All Buyers</option>
            {buyers.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Receiving">Receiving</option>
            <option value="Completed">Completed</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* PO Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Style</th>
                <th className="py-3 px-4">Buyer</th>
                <th className="py-3 px-4">Fabric Specification</th>
                <th className="py-3 px-4 text-right">Order Qty</th>
                <th className="py-3 px-4 text-right">Received</th>
                <th className="py-3 px-4 text-right">In Store</th>
                <th className="py-3 px-4 text-center">Fulfillment</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No purchase orders found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPOs.map(po => {
                  const poStats = getPOStats(po.poNumber);
                  const fulfillmentPct = Math.min(100, Math.round((poStats.totalReceivedKg / (po.orderQty || 1)) * 100));

                  return (
                    <tr key={po.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900">{po.poNumber}</span>
                        <span className="block text-[10px] text-slate-400 font-sans">{po.season}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{po.style}</td>
                      <td className="py-3 px-4 text-slate-700">{po.buyer}</td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={po.item}>
                        {po.item}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {po.orderQty.toLocaleString()} {po.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-blue-700">
                        {poStats.totalReceivedKg.toFixed(1)} KG
                        <span className="block text-[10px] text-slate-400 font-sans">{poStats.totalRolls} rolls</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-emerald-700">
                        {poStats.inStockKg.toFixed(1)} KG
                        <span className="block text-[10px] text-slate-400 font-sans">{poStats.activeRolls} active</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-24 mx-auto">
                          <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
                            <span>{fulfillmentPct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${fulfillmentPct >= 100 ? 'bg-emerald-600' : 'bg-blue-600'}`}
                              style={{ width: `${fulfillmentPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            po.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : po.status === 'Receiving'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : po.status === 'Pending'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onNavigateToReceive(po.poNumber)}
                            title="Receive Fabric for this PO"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <PackagePlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onNavigateToIssue(po.poNumber)}
                            title="Issue Fabric for this PO"
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewingPO(po)}
                            title="View PO Details"
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(po)}
                            disabled={!canManagePOs}
                            title={!canManagePOs ? 'Only Master Admin and Store In-Charge can edit POs' : 'Edit PO'}
                            className={`p-1.5 rounded transition-colors ${
                              canManagePOs
                                ? 'text-slate-500 hover:bg-slate-100'
                                : 'text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deletePO(po.id)}
                            disabled={!canDeleteRecords}
                            title={!canDeleteRecords ? 'Master Admin privileges required to delete PO records' : 'Delete PO'}
                            className={`p-1.5 rounded transition-colors ${
                              canDeleteRecords
                                ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                : 'text-slate-300 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Create / Edit PO Modal */}
      {isNewPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-slate-700" />
                <h3 className="font-semibold text-slate-900">
                  {editingPO ? 'Edit Purchase Order' : 'Create New Purchase Order (PO)'}
                </h3>
              </div>
              <button
                onClick={() => setIsNewPOModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPO} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PO Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PO-2026-9041"
                    value={formData.poNumber}
                    onChange={e => setFormData({ ...formData, poNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Style Code / Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. POLO-SLIM-24"
                    value={formData.style}
                    onChange={e => setFormData({ ...formData, style: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Buyer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. H&M, Inditex, Nike, Target"
                    value={formData.buyer}
                    onChange={e => setFormData({ ...formData, buyer: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fabric Supplier / Mill
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Spinning, Square Textiles"
                    value={formData.supplier}
                    onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fabric Item Specification <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 100% Combed Cotton Single Jersey 180 GSM"
                    value={formData.item}
                    onChange={e => setFormData({ ...formData, item: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Order Quantity (KG) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.orderQty}
                    onChange={e => setFormData({ ...formData, orderQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Season
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Spring/Summer 2026"
                    value={formData.season}
                    onChange={e => setFormData({ ...formData, season: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Order Placement Date
                  </label>
                  <input
                    type="date"
                    value={formData.orderDate}
                    onChange={e => setFormData({ ...formData, orderDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fabric Delivery Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PO Order Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as PurchaseOrder['status'] })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Receiving">Receiving</option>
                    <option value="Completed">Completed</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Remarks / Tolerances
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shrinkage +/- 4%, 4-point QC"
                    value={formData.remarks}
                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewPOModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  {editingPO ? 'Update Purchase Order' : 'Create Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View PO Details Drawer / Modal */}
      {viewingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-lg text-slate-900">{viewingPO.poNumber}</span>
                <span className="text-xs text-slate-500 font-sans">· {viewingPO.buyer}</span>
                <span className="text-xs text-slate-500 font-sans">· {viewingPO.style}</span>
              </div>
              <button onClick={() => setViewingPO(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* PO Specs summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block">Buyer</span>
                  <span className="font-semibold text-slate-900">{viewingPO.buyer}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Style</span>
                  <span className="font-semibold text-slate-900">{viewingPO.style}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Supplier</span>
                  <span className="font-semibold text-slate-900">{viewingPO.supplier || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Season</span>
                  <span className="font-semibold text-slate-900">{viewingPO.season}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Fabric Specification</span>
                  <span className="font-medium text-slate-900">{viewingPO.item}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Order Quantity</span>
                  <span className="font-mono font-bold text-slate-900">{viewingPO.orderQty} {viewingPO.unit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Delivery Deadline</span>
                  <span className="font-mono text-slate-800">{viewingPO.deliveryDate}</span>
                </div>
              </div>

              {/* Linked Rolls Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Received Fabric Rolls against {viewingPO.poNumber}
                  </h4>
                  <button
                    onClick={() => {
                      setViewingPO(null);
                      onNavigateToReceive(viewingPO.poNumber);
                    }}
                    className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                  >
                    <PackagePlus className="w-3.5 h-3.5" />
                    Receive Next Batch
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Roll No</th>
                        <th className="py-2 px-3">Receive Date</th>
                        <th className="py-2 px-3">Challan</th>
                        <th className="py-2 px-3">Color</th>
                        <th className="py-2 px-3">Lot No</th>
                        <th className="py-2 px-3">Rack</th>
                        <th className="py-2 px-3 text-right">Original (KG)</th>
                        <th className="py-2 px-3 text-right">In Store (KG)</th>
                        <th className="py-2 px-3 text-center">QC Status</th>
                        <th className="py-2 px-3 text-center">Stock Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {rolls.filter(r => r.poNumber === viewingPO.poNumber).length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-4 text-center text-slate-400 font-sans">
                            No fabric rolls have been received yet for this PO.
                          </td>
                        </tr>
                      ) : (
                        rolls
                          .filter(r => r.poNumber === viewingPO.poNumber)
                          .map(roll => (
                            <tr key={roll.id} className="hover:bg-slate-50">
                              <td className="py-1.5 px-3 font-bold text-slate-900">{roll.rollNo}</td>
                              <td className="py-1.5 px-3 text-slate-600">{roll.receiveDate}</td>
                              <td className="py-1.5 px-3 text-slate-600">{roll.challanNo}</td>
                              <td className="py-1.5 px-3 font-sans text-slate-800">{roll.color}</td>
                              <td className="py-1.5 px-3 text-slate-600">{roll.lotNo}</td>
                              <td className="py-1.5 px-3 font-semibold text-slate-700">{roll.rackNo}</td>
                              <td className="py-1.5 px-3 text-right text-slate-600">{roll.originalWeight.toFixed(2)}</td>
                              <td className="py-1.5 px-3 text-right font-bold text-emerald-700">{roll.currentWeight.toFixed(2)}</td>
                              <td className="py-1.5 px-3 text-center font-sans">
                                <span className="text-[10px] font-medium text-slate-700">{roll.qualityStatus}</span>
                              </td>
                              <td className="py-1.5 px-3 text-center font-sans">
                                <span
                                  className={`text-[10px] font-medium ${
                                    roll.stockStatus === 'In Stock'
                                      ? 'text-emerald-700'
                                      : roll.stockStatus === 'Partially Issued'
                                      ? 'text-amber-700'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {roll.stockStatus}
                                </span>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-200 shrink-0">
              <button
                onClick={() => setViewingPO(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
