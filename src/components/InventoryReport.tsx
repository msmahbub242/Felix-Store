import React, { useState } from 'react';
import { useFabricStore } from '../context/FabricStoreContext';
import { FabricRoll, PurchaseOrder } from '../types/fabric';
import {
  ClipboardList,
  Search,
  Download,
  Printer,
  ChevronDown,
  ChevronRight,
  Filter,
  Tag,
  ArrowUpDown,
  Building,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { RollLabelModal } from './RollLabelModal';

export const InventoryReport: React.FC = () => {
  const { pos, rolls, racks } = useFabricStore();

  const [viewMode, setViewMode] = useState<'po-wise' | 'roll-ledger' | 'rack-wise'>('po-wise');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPO, setSelectedPO] = useState('ALL');
  const [selectedBuyer, setSelectedBuyer] = useState('ALL');
  const [selectedRack, setSelectedRack] = useState('ALL');
  const [selectedFabricType, setSelectedFabricType] = useState('ALL');
  const [selectedQuality, setSelectedQuality] = useState('ALL');
  const [selectedStockStatus, setSelectedStockStatus] = useState<'ALL' | 'IN_STOCK' | 'PARTIAL' | 'EXHAUSTED'>('IN_STOCK');

  // Expandable POs in PO-wise view
  const [expandedPOs, setExpandedPOs] = useState<Record<string, boolean>>({});

  // Printable roll tag
  const [selectedRollForTag, setSelectedRollForTag] = useState<FabricRoll | null>(null);

  // Sorting for roll ledger
  const [sortField, setSortField] = useState<'rollNo' | 'poNumber' | 'currentWeight' | 'receiveDate'>('receiveDate');
  const [sortAsc, setSortAsc] = useState(false);

  const buyers = Array.from(new Set(rolls.map(r => r.buyer))).filter(Boolean);
  const fabricTypes = Array.from(new Set(rolls.map(r => r.fabricType))).filter(Boolean);
  const rackNames = racks.map(r => r.name);

  const toggleExpandPO = (poNumber: string) => {
    setExpandedPOs(prev => ({ ...prev, [poNumber]: !prev[poNumber] }));
  };

  // Filtered rolls
  const filteredRolls = rolls.filter(roll => {
    const matchesSearch =
      roll.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roll.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roll.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roll.style.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roll.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roll.lotNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roll.item.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPO = selectedPO === 'ALL' || roll.poNumber === selectedPO;
    const matchesBuyer = selectedBuyer === 'ALL' || roll.buyer === selectedBuyer;
    const matchesRack = selectedRack === 'ALL' || roll.rackNo === selectedRack;
    const matchesFabricType = selectedFabricType === 'ALL' || roll.fabricType === selectedFabricType;
    const matchesQuality = selectedQuality === 'ALL' || roll.qualityStatus === selectedQuality;

    let matchesStock = true;
    if (selectedStockStatus === 'IN_STOCK') {
      matchesStock = roll.currentWeight > 0.001;
    } else if (selectedStockStatus === 'PARTIAL') {
      matchesStock = roll.stockStatus === 'Partially Issued' && roll.currentWeight > 0;
    } else if (selectedStockStatus === 'EXHAUSTED') {
      matchesStock = roll.currentWeight <= 0.001 || roll.stockStatus === 'Exhausted';
    }

    return matchesSearch && matchesPO && matchesBuyer && matchesRack && matchesFabricType && matchesQuality && matchesStock;
  });

  // Sorted rolls
  const sortedRolls = [...filteredRolls].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'rollNo') {
      comparison = a.rollNo.localeCompare(b.rollNo);
    } else if (sortField === 'poNumber') {
      comparison = a.poNumber.localeCompare(b.poNumber);
    } else if (sortField === 'currentWeight') {
      comparison = a.currentWeight - b.currentWeight;
    } else if (sortField === 'receiveDate') {
      comparison = new Date(a.receiveDate).getTime() - new Date(b.receiveDate).getTime();
    }
    return sortAsc ? comparison : -comparison;
  });

  // Export to CSV Function
  const handleExportCSV = () => {
    const headers = [
      'PO Number',
      'Roll No',
      'Receive Date',
      'Challan No',
      'Buyer',
      'Style',
      'Fabric Item',
      'Fabric Type',
      'Color',
      'Lot No',
      'GSM',
      'Width',
      'Rack No',
      'Quality Status',
      'Original Weight (KG)',
      'Current Weight (KG)',
      'Stock Status',
      'Supplier',
    ];

    const rows = sortedRolls.map(r => [
      `"${r.poNumber}"`,
      `"${r.rollNo}"`,
      `"${r.receiveDate}"`,
      `"${r.challanNo}"`,
      `"${r.buyer}"`,
      `"${r.style}"`,
      `"${r.item.replace(/"/g, '""')}"`,
      `"${r.fabricType}"`,
      `"${r.color}"`,
      `"${r.lotNo}"`,
      r.gsm,
      `"${r.width}"`,
      `"${r.rackNo}"`,
      `"${r.qualityStatus}"`,
      r.originalWeight.toFixed(2),
      r.currentWeight.toFixed(2),
      `"${r.stockStatus}"`,
      `"${r.supplier}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fabric_inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PO-wise aggregations
  const poSummaries = pos.map(po => {
    const poRolls = rolls.filter(r => r.poNumber === po.poNumber);
    const totalReceivedKg = poRolls.reduce((sum, r) => sum + r.originalWeight, 0);
    const inStockKg = poRolls.reduce((sum, r) => sum + r.currentWeight, 0);
    const issuedKg = totalReceivedKg - inStockKg;
    const activeRollsCount = poRolls.filter(r => r.currentWeight > 0.001).length;

    return {
      po,
      poRolls,
      totalRolls: poRolls.length,
      activeRolls: activeRollsCount,
      totalReceivedKg: Math.round(totalReceivedKg * 10) / 10,
      issuedKg: Math.round(issuedKg * 10) / 10,
      inStockKg: Math.round(inStockKg * 10) / 10,
      balanceToReceiveKg: Math.max(0, Math.round((po.orderQty - totalReceivedKg) * 10) / 10),
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Inventory &amp; Stock Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time warehouse fabric stock filtered PO-wise, Rack-wise, Buyer-wise, and individual roll audit trail.
          </p>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setViewMode('po-wise')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'po-wise'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PO-Wise Summary
            </button>
            <button
              onClick={() => setViewMode('roll-ledger')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'roll-ledger'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Roll Ledger ({filteredRolls.length})
            </button>
            <button
              onClick={() => setViewMode('rack-wise')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'rack-wise'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rack-Wise View
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {/* Search text */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search roll, PO, buyer, color, lot..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          {/* PO Filter */}
          <div>
            <select
              value={selectedPO}
              onChange={e => setSelectedPO(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">All POs</option>
              {pos.map(po => (
                <option key={po.id} value={po.poNumber}>
                  {po.poNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Buyer Filter */}
          <div>
            <select
              value={selectedBuyer}
              onChange={e => setSelectedBuyer(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">All Buyers</option>
              {buyers.map(b => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Rack Filter */}
          <div>
            <select
              value={selectedRack}
              onChange={e => setSelectedRack(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">All Racks</option>
              {rackNames.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Fabric Type */}
          <div>
            <select
              value={selectedFabricType}
              onChange={e => setSelectedFabricType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">All Fabric Types</option>
              {fabricTypes.map(ft => (
                <option key={ft} value={ft}>
                  {ft}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status */}
          <div>
            <select
              value={selectedStockStatus}
              onChange={e => setSelectedStockStatus(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 font-semibold text-slate-800"
            >
              <option value="IN_STOCK">In Stock (&gt;0 KG)</option>
              <option value="ALL">All Records</option>
              <option value="PARTIAL">Partially Cut</option>
              <option value="EXHAUSTED">Exhausted (0 KG)</option>
            </select>
          </div>
        </div>

        {/* Quick summary of filtered data */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500 font-mono">
          <div>
            Showing <span className="font-bold text-slate-900">{filteredRolls.length}</span> matching rolls
          </div>
          <div className="flex items-center gap-4">
            <span>
              Total In-Store Weight:{' '}
              <span className="font-bold text-emerald-700 text-sm">
                {filteredRolls.reduce((sum, r) => sum + r.currentWeight, 0).toFixed(2)} KG
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* VIEW 1: PO-Wise Summary View */}
      {viewMode === 'po-wise' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              PO-Wise Stock &amp; Fulfillment Summary
            </h3>
            <span className="text-xs text-slate-500">{pos.length} Purchase Orders</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-8"></th>
                  <th className="py-2.5 px-3">PO Number</th>
                  <th className="py-2.5 px-3">Buyer</th>
                  <th className="py-2.5 px-3">Style</th>
                  <th className="py-2.5 px-3">Item Specification</th>
                  <th className="py-2.5 px-3 text-right">Order Qty</th>
                  <th className="py-2.5 px-3 text-right">Received (KG)</th>
                  <th className="py-2.5 px-3 text-right">Issued (KG)</th>
                  <th className="py-2.5 px-3 text-right">Current Stock</th>
                  <th className="py-2.5 px-3 text-center">Active Rolls</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {poSummaries.map(item => {
                  const isExpanded = !!expandedPOs[item.po.poNumber];
                  return (
                    <React.Fragment key={item.po.id}>
                      <tr
                        onClick={() => toggleExpandPO(item.po.poNumber)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 text-slate-400 text-center">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-700" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {item.po.poNumber}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{item.po.buyer}</td>
                        <td className="py-3 px-3 text-slate-700">{item.po.style}</td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={item.po.item}>
                          {item.po.item}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {item.po.orderQty.toLocaleString()} {item.po.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-blue-700">
                          {item.totalReceivedKg.toFixed(1)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-amber-800">
                          {item.issuedKg.toFixed(1)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          {item.inStockKg.toFixed(1)} KG
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span className="font-bold text-slate-900">{item.activeRolls}</span>
                          <span className="text-[10px] text-slate-400"> / {item.totalRolls}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                              item.po.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : item.po.status === 'Receiving'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {item.po.status}
                          </span>
                        </td>
                      </tr>

                      {/* Expandable Rolls Breakdown */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={11} className="bg-slate-50 p-4 border-t border-b border-slate-200">
                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                              <div className="px-4 py-2 bg-slate-100 font-semibold text-xs text-slate-700 flex justify-between">
                                <span>Itemized Rolls under {item.po.poNumber}</span>
                                <span>{item.poRolls.length} total rolls received</span>
                              </div>
                              <table className="w-full text-left text-xs font-mono">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                  <tr>
                                    <th className="py-1.5 px-3">Roll No</th>
                                    <th className="py-1.5 px-3">Receive Date</th>
                                    <th className="py-1.5 px-3">Challan</th>
                                    <th className="py-1.5 px-3 font-sans">Color</th>
                                    <th className="py-1.5 px-3">Lot No</th>
                                    <th className="py-1.5 px-3 font-sans">Rack</th>
                                    <th className="py-1.5 px-3 text-right">Received (KG)</th>
                                    <th className="py-1.5 px-3 text-right">In Store (KG)</th>
                                    <th className="py-1.5 px-3 text-center font-sans">Status</th>
                                    <th className="py-1.5 px-3 text-right font-sans">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {item.poRolls.map(roll => (
                                    <tr key={roll.id} className="hover:bg-slate-50">
                                      <td className="py-1.5 px-3 font-bold text-slate-900">{roll.rollNo}</td>
                                      <td className="py-1.5 px-3 text-slate-600">{roll.receiveDate}</td>
                                      <td className="py-1.5 px-3 text-slate-600">{roll.challanNo}</td>
                                      <td className="py-1.5 px-3 font-sans text-slate-800">{roll.color}</td>
                                      <td className="py-1.5 px-3 text-slate-600">{roll.lotNo}</td>
                                      <td className="py-1.5 px-3 font-semibold text-slate-700">{roll.rackNo}</td>
                                      <td className="py-1.5 px-3 text-right">{roll.originalWeight.toFixed(2)}</td>
                                      <td className="py-1.5 px-3 text-right font-bold text-emerald-700">
                                        {roll.currentWeight.toFixed(2)}
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
                                      <td className="py-1.5 px-3 text-right font-sans">
                                        <button
                                          onClick={e => {
                                            e.stopPropagation();
                                            setSelectedRollForTag(roll);
                                          }}
                                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800"
                                        >
                                          <Tag className="w-3 h-3" />
                                          <span>Print Tag</span>
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Roll-by-Roll Detailed Ledger */}
      {viewMode === 'roll-ledger' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Detailed Fabric Roll Inventory Ledger
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {sortedRolls.length} rolls displayed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 font-sans">
                <tr>
                  <th className="py-2.5 px-3">
                    <button
                      onClick={() => {
                        setSortField('rollNo');
                        setSortAsc(!sortAsc);
                      }}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      Roll No <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3">
                    <button
                      onClick={() => {
                        setSortField('poNumber');
                        setSortAsc(!sortAsc);
                      }}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      PO Number <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3">Buyer</th>
                  <th className="py-2.5 px-3">Style</th>
                  <th className="py-2.5 px-3">Color</th>
                  <th className="py-2.5 px-3">Lot No</th>
                  <th className="py-2.5 px-3">GSM</th>
                  <th className="py-2.5 px-3">Rack</th>
                  <th className="py-2.5 px-3 text-right">Orig. (KG)</th>
                  <th className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => {
                        setSortField('currentWeight');
                        setSortAsc(!sortAsc);
                      }}
                      className="inline-flex items-center gap-1 hover:text-slate-900 ml-auto"
                    >
                      In Store (KG) <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3 text-center">QC Status</th>
                  <th className="py-2.5 px-3 text-center">Stock</th>
                  <th className="py-2.5 px-3 text-right">Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRolls.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-slate-400 font-sans">
                      No fabric rolls found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  sortedRolls.map(roll => (
                    <tr key={roll.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-900">{roll.rollNo}</td>
                      <td className="py-2 px-3 text-blue-700 font-bold">{roll.poNumber}</td>
                      <td className="py-2 px-3 font-sans text-slate-700">{roll.buyer}</td>
                      <td className="py-2 px-3 font-sans text-slate-600">{roll.style}</td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-800">{roll.color}</td>
                      <td className="py-2 px-3 text-slate-600">{roll.lotNo}</td>
                      <td className="py-2 px-3 text-slate-600">{roll.gsm}</td>
                      <td className="py-2 px-3 font-semibold text-slate-700 font-sans">{roll.rackNo}</td>
                      <td className="py-2 px-3 text-right text-slate-500">{roll.originalWeight.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">
                        {roll.currentWeight.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span className="text-[10px] font-medium text-slate-700">{roll.qualityStatus}</span>
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
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
                      <td className="py-2 px-3 text-right font-sans">
                        <button
                          onClick={() => setSelectedRollForTag(roll)}
                          title="Print Roll QR / Barcode Tag"
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Rack-Wise Breakdown */}
      {viewMode === 'rack-wise' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {racks.map(rack => {
            const rackRolls = rolls.filter(r => r.rackNo === rack.name && r.currentWeight > 0.001);
            const totalRackWeight = rackRolls.reduce((sum, r) => sum + r.currentWeight, 0);
            const occupancyPct = Math.min(100, Math.round((totalRackWeight / rack.capacityKg) * 100));

            return (
              <div key={rack.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-900 font-mono">{rack.name}</span>
                    <span className="text-xs text-slate-500 font-mono">{occupancyPct}% full</span>
                  </div>
                  <div className="text-xs text-slate-500 mb-3">{rack.zone}</div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full ${
                        occupancyPct > 85 ? 'bg-amber-600' : 'bg-slate-800'
                      }`}
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Stored Fabric</span>
                      <span className="font-bold text-slate-900">{totalRackWeight.toFixed(1)} KG</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Active Rolls</span>
                      <span className="font-bold text-slate-900">{rackRolls.length} Rolls</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Cap: {rack.capacityKg} KG</span>
                  <button
                    onClick={() => {
                      setSelectedRack(rack.name);
                      setViewMode('roll-ledger');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    View Rolls &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Printable Roll Tag Modal */}
      {selectedRollForTag && (
        <RollLabelModal
          roll={selectedRollForTag}
          onClose={() => setSelectedRollForTag(null)}
        />
      )}
    </div>
  );
};
