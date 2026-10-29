import React, { useState, useEffect } from 'react';
import { useFabricStore } from '../context/FabricStoreContext';
import { QualityStatus, FabricReceiveRecord } from '../types/fabric';
import {
  PackagePlus,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  Printer,
  Sparkles,
  Info,
  Calendar,
  Building,
  Hash,
  QrCode,
  Tag,
} from 'lucide-react';
import { ReceiveChallanModal } from './ReceiveChallanModal';
import { RollLabelModal } from './RollLabelModal';
import { FabricRoll, ROLE_LABELS } from '../types/fabric';

interface FabricReceiveProps {
  initialPoNumber?: string;
}

interface RollRowInput {
  rollNo: string;
  rollIndex: number;
  color: string;
  fabricType: string;
  gsm: number;
  lotNo: string;
  weight: number;
  rackNo: string;
  width: string;
  qualityStatus: QualityStatus;
  shadeGrade: string;
  remarks: string;
}

export const FabricReceive: React.FC<FabricReceiveProps> = ({ initialPoNumber }) => {
  const {
    pos,
    rolls,
    receives,
    racks,
    getPOByNumber,
    getNextRollNumberForPO,
    createReceive,
    currentUser,
    hasPermission,
  } = useFabricStore();

  const canReceive = hasPermission('canReceiveFabric');

  const [activeSubTab, setActiveSubTab] = useState<'new-receive' | 'receive-history'>('new-receive');

  // Selected PO
  const [selectedPoNumber, setSelectedPoNumber] = useState(
    initialPoNumber || (pos.length > 0 ? pos[0].poNumber : '')
  );

  // Auto-filled info from PO
  const selectedPO = getPOByNumber(selectedPoNumber);

  // Consignment header fields
  const [receivingDate, setReceivingDate] = useState(new Date().toISOString().split('T')[0]);
  const [challanNo, setChallanNo] = useState(`CH-${Math.floor(1000 + Math.random() * 9000)}`);
  const [supplier, setSupplier] = useState('');
  const [receivedBy, setReceivedBy] = useState(
    `${currentUser.name} (${ROLE_LABELS[currentUser.role].label})`
  );
  const [remarks, setRemarks] = useState('');

  // Sync receivedBy when active user changes
  useEffect(() => {
    setReceivedBy(`${currentUser.name} (${ROLE_LABELS[currentUser.role].label})`);
  }, [currentUser]);

  // When PO changes, sync supplier from PO
  useEffect(() => {
    if (selectedPO) {
      setSupplier(selectedPO.supplier || '');
    }
  }, [selectedPO]);

  // Roll rows currently being entered for this receive
  const [rollRows, setRollRows] = useState<RollRowInput[]>([]);

  // Batch Quick Add State
  const [batchCount, setBatchCount] = useState(4);
  const [batchColor, setBatchColor] = useState('Navy Blue');
  const [batchFabricType, setBatchFabricType] = useState('Single Jersey');
  const [batchGsm, setBatchGsm] = useState(180);
  const [batchLot, setBatchLot] = useState('LOT-101');
  const [batchWeight, setBatchWeight] = useState(25.0);
  const [batchRack, setBatchRack] = useState(racks.length > 0 ? racks[0].name : 'Rack A-01');
  const [batchWidth, setBatchWidth] = useState('68"');
  const [batchStatus, setBatchStatus] = useState<QualityStatus>('Approved');

  // Modal for viewing/printing newly created or historical GRN
  const [viewingReceive, setViewingReceive] = useState<FabricReceiveRecord | null>(null);

  // Label printing modal states
  const [labelModalRolls, setLabelModalRolls] = useState<FabricRoll[] | null>(null);
  const [labelModalSingleRoll, setLabelModalSingleRoll] = useState<FabricRoll | null>(null);

  // Helper to convert input row into full FabricRoll for live label printing
  const convertRowToFabricRoll = (row: RollRowInput): FabricRoll => ({
    id: `temp-${row.rollNo}`,
    poId: selectedPO?.id || 'po-tmp',
    poNumber: selectedPoNumber || 'PO-UNASSIGNED',
    rollNo: row.rollNo,
    rollIndex: row.rollIndex,
    receivingId: 'rcv-preview',
    receiveDate: receivingDate,
    challanNo: challanNo || 'CH-PENDING',
    supplier: supplier || selectedPO?.supplier || 'Textile Mills',
    buyer: selectedPO?.buyer || 'Buyer Stock',
    style: selectedPO?.style || 'Style Ref',
    item: selectedPO?.item || 'Fabric Item',
    color: row.color,
    fabricType: row.fabricType,
    gsm: Number(row.gsm) || 180,
    lotNo: row.lotNo,
    originalWeight: Number(row.weight) || 0,
    currentWeight: Number(row.weight) || 0,
    rackNo: row.rackNo,
    width: row.width,
    qualityStatus: row.qualityStatus,
    shadeGrade: row.shadeGrade,
    stockStatus: 'In Stock',
    remarks: row.remarks,
  });

  // Existing rolls count for this PO
  const existingPoRolls = rolls.filter(
    r => r.poNumber.trim().toLowerCase() === selectedPoNumber.trim().toLowerCase()
  );

  // Re-calculate / initialize serial numbers whenever selected PO changes or user resets rows
  const initializeRowsForPO = (poNum: string) => {
    if (!poNum) return;
    const { nextIndex } = getNextRollNumberForPO(poNum);

    // Default with 2 clean rows
    const initialRows: RollRowInput[] = [
      {
        rollNo: `R-${String(nextIndex).padStart(3, '0')}`,
        rollIndex: nextIndex,
        color: selectedPO ? selectedPO.style.includes('DENIM') ? 'Indigo Blue' : 'Navy Blue' : 'Navy Blue',
        fabricType: selectedPO?.item.split(' ')[1] || 'Single Jersey',
        gsm: 180,
        lotNo: `LOT-${Math.floor(100 + Math.random() * 900)}`,
        weight: 25.5,
        rackNo: racks[0]?.name || 'Rack A-01',
        width: '68"',
        qualityStatus: 'Approved',
        shadeGrade: 'A',
        remarks: '',
      },
      {
        rollNo: `R-${String(nextIndex + 1).padStart(3, '0')}`,
        rollIndex: nextIndex + 1,
        color: selectedPO ? selectedPO.style.includes('DENIM') ? 'Indigo Blue' : 'Navy Blue' : 'Navy Blue',
        fabricType: selectedPO?.item.split(' ')[1] || 'Single Jersey',
        gsm: 180,
        lotNo: `LOT-${Math.floor(100 + Math.random() * 900)}`,
        weight: 26.0,
        rackNo: racks[0]?.name || 'Rack A-01',
        width: '68"',
        qualityStatus: 'Approved',
        shadeGrade: 'A',
        remarks: '',
      },
    ];
    setRollRows(initialRows);
  };

  useEffect(() => {
    if (selectedPoNumber) {
      initializeRowsForPO(selectedPoNumber);
    }
  }, [selectedPoNumber]);

  // Add a single row with the next sequential serial number
  const handleAddSingleRow = () => {
    const { nextIndex: baseIndex } = getNextRollNumberForPO(selectedPoNumber);
    const nextIndex = baseIndex + rollRows.length;
    const nextRollNo = `R-${String(nextIndex).padStart(3, '0')}`;

    const lastRow = rollRows[rollRows.length - 1];

    const newRow: RollRowInput = {
      rollNo: nextRollNo,
      rollIndex: nextIndex,
      color: lastRow ? lastRow.color : 'Navy Blue',
      fabricType: lastRow ? lastRow.fabricType : 'Single Jersey',
      gsm: lastRow ? lastRow.gsm : 180,
      lotNo: lastRow ? lastRow.lotNo : 'LOT-01',
      weight: 25.0,
      rackNo: lastRow ? lastRow.rackNo : racks[0]?.name || 'Rack A-01',
      width: lastRow ? lastRow.width : '68"',
      qualityStatus: 'Approved',
      shadeGrade: 'A',
      remarks: '',
    };

    setRollRows([...rollRows, newRow]);
  };

  // Batch generate rows with continuous auto-increment serials
  const handleApplyBatchGeneration = () => {
    if (batchCount <= 0) return;
    const { nextIndex: baseIndex } = getNextRollNumberForPO(selectedPoNumber);

    const generated: RollRowInput[] = [];
    for (let i = 0; i < batchCount; i++) {
      const rollIndex = baseIndex + i;
      const rollNo = `R-${String(rollIndex).padStart(3, '0')}`;
      // Slight realistic weight variation +/- 0.5kg
      const variedWeight = Math.round((batchWeight + (Math.random() * 1.6 - 0.8)) * 10) / 10;

      generated.push({
        rollNo,
        rollIndex,
        color: batchColor,
        fabricType: batchFabricType,
        gsm: batchGsm,
        lotNo: batchLot,
        weight: variedWeight > 0 ? variedWeight : batchWeight,
        rackNo: batchRack,
        width: batchWidth,
        qualityStatus: batchStatus,
        shadeGrade: 'A',
        remarks: 'Batch received',
      });
    }

    setRollRows(generated);
  };

  // Remove a row and re-sequence serial numbers to maintain clean continuous order
  const handleRemoveRow = (indexToRemove: number) => {
    const remaining = rollRows.filter((_, idx) => idx !== indexToRemove);
    const { nextIndex: baseIndex } = getNextRollNumberForPO(selectedPoNumber);

    // Re-index remaining rows so serials stay contiguous
    const reindexed = remaining.map((row, idx) => {
      const newIndex = baseIndex + idx;
      return {
        ...row,
        rollIndex: newIndex,
        rollNo: `R-${String(newIndex).padStart(3, '0')}`,
      };
    });

    setRollRows(reindexed);
  };

  const handleUpdateRow = (index: number, field: keyof RollRowInput, value: any) => {
    setRollRows(prev =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  // Submit the consignment
  const handleSubmitReceive = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPoNumber) {
      alert('Please select a Purchase Order.');
      return;
    }

    if (!challanNo.trim()) {
      alert('Please enter a Challan / Invoice number.');
      return;
    }

    if (rollRows.length === 0) {
      alert('Please add at least one fabric roll to receive.');
      return;
    }

    // Validate weights
    for (const row of rollRows) {
      if (!row.weight || row.weight <= 0) {
        alert(`Roll ${row.rollNo} has invalid weight. Weight must be greater than 0.`);
        return;
      }
    }

    const newRecord = createReceive(
      {
        receivingDate,
        challanNo,
        poNumber: selectedPoNumber,
        supplier,
        receivedBy,
        remarks,
      },
      rollRows.map(r => ({
        color: r.color,
        fabricType: r.fabricType,
        gsm: Number(r.gsm),
        lotNo: r.lotNo,
        weight: Number(r.weight),
        rackNo: r.rackNo,
        width: r.width,
        qualityStatus: r.qualityStatus,
        shadeGrade: r.shadeGrade,
        remarks: r.remarks,
      }))
    );

    // Open GRN view
    setViewingReceive(newRecord);

    // Reset form for next receive
    setChallanNo(`CH-${Math.floor(1000 + Math.random() * 9000)}`);
    setRemarks('');
    initializeRowsForPO(selectedPoNumber);
  };

  const totalConsignmentWeight = rollRows.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
  const poTotalReceived = existingPoRolls.reduce((sum, r) => sum + r.originalWeight, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Fabric Receiving against PO</h1>
          <p className="text-xs text-slate-500 mt-1">
            Receive incoming fabric consignments with automated serial numbering, unique per PO, and real-time inventory racking.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveSubTab('new-receive')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'new-receive'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New Consignment Entry
          </button>
          <button
            onClick={() => setActiveSubTab('receive-history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'receive-history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Challan History ({receives.length})
          </button>
        </div>
      </div>

      {!canReceive && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <span className="font-bold">Viewing Mode Only:</span> You are currently logged in as{' '}
              <span className="font-semibold">{currentUser.name}</span> ({ROLE_LABELS[currentUser.role].label}).
              Creating and logging new GRN consignment entries is restricted to Master Admin, Store In-Charge, and Store Operators.
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'receive-history' ? (
        /* Historical Receives View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Past Goods Received Notes (GRN / MRR)</h3>
            <span className="text-xs text-slate-500">{receives.length} consignments logged</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Receiving Date</th>
                  <th className="py-2.5 px-4">Challan No</th>
                  <th className="py-2.5 px-4">PO Number</th>
                  <th className="py-2.5 px-4">Buyer & Style</th>
                  <th className="py-2.5 px-4">Supplier</th>
                  <th className="py-2.5 px-4 text-center">Rolls Count</th>
                  <th className="py-2.5 px-4 text-right">Total Weight</th>
                  <th className="py-2.5 px-4">Received By</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {receives.map(rcv => (
                  <tr key={rcv.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 text-slate-600">{rcv.receivingDate}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{rcv.challanNo}</td>
                    <td className="py-3 px-4 text-blue-700 font-bold">{rcv.poNumber}</td>
                    <td className="py-3 px-4 font-sans text-slate-800">
                      <div className="font-semibold">{rcv.buyer}</div>
                      <div className="text-[11px] text-slate-500">{rcv.style}</div>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600 truncate max-w-[180px]">{rcv.supplier}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{rcv.rollCount}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{rcv.totalWeight.toFixed(2)} KG</td>
                    <td className="py-3 px-4 font-sans text-slate-600">{rcv.receivedBy}</td>
                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setLabelModalRolls(rcv.rolls)}
                          title="Print Barcode & QR stickers for all rolls in this Challan"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Print Labels</span>
                        </button>
                        <button
                          onClick={() => setViewingReceive(rcv)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View GRN</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* New Consignment Entry */
        <form onSubmit={handleSubmitReceive} className="space-y-6">
          {/* Top Consignment Header Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Building className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                1. Consignment & Purchase Order Link
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* PO Selection (Crucial Requirement) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Purchase Order (PO) <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedPoNumber}
                  onChange={e => setSelectedPoNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono font-bold text-slate-900"
                >
                  <option value="">-- Choose PO --</option>
                  {pos.map(po => (
                    <option key={po.id} value={po.poNumber}>
                      {po.poNumber} ({po.buyer} - {po.style})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Auto-calls Style, Buyer, Item & specs
                </span>
              </div>

              {/* Challan No */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Challan / Invoice No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={challanNo}
                  onChange={e => setChallanNo(e.target.value)}
                  placeholder="e.g. CH-8891"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>

              {/* Receiving Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Receiving Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={receivingDate}
                  onChange={e => setReceivingDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supplier / Knitting Mill
                </label>
                <input
                  type="text"
                  value={supplier}
                  onChange={e => setSupplier(e.target.value)}
                  placeholder="e.g. Apex Spinning Mills"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Auto-called PO Details Banner */}
            {selectedPO ? (
              <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div>
                    <span className="text-blue-600 block text-[10px] uppercase font-bold">Buyer</span>
                    <span className="font-semibold text-slate-900">{selectedPO.buyer}</span>
                  </div>
                  <div>
                    <span className="text-blue-600 block text-[10px] uppercase font-bold">Style Ref</span>
                    <span className="font-semibold text-slate-900">{selectedPO.style}</span>
                  </div>
                  <div>
                    <span className="text-blue-600 block text-[10px] uppercase font-bold">Item Specification</span>
                    <span className="font-medium text-slate-900">{selectedPO.item}</span>
                  </div>
                  <div>
                    <span className="text-blue-600 block text-[10px] uppercase font-bold">Order Qty</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedPO.orderQty} {selectedPO.unit}
                    </span>
                  </div>
                </div>

                {/* Auto-Serial Status Indicator */}
                <div className="bg-white px-3 py-1.5 rounded-md border border-blue-300 text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">
                    Sequential Roll Counter for {selectedPO.poNumber}
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    Existing Rolls: <span className="font-mono text-blue-700">{existingPoRolls.length}</span> · Next Auto-Serial:{' '}
                    <span className="font-mono text-emerald-700 font-black">
                      {getNextRollNumberForPO(selectedPoNumber).rollNo}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                Select a Purchase Order above to automatically recall Style, Buyer, Item, and continuous roll serials.
              </div>
            )}
          </div>

          {/* Quick Batch Roll Add Drawer (Accordion or toolbar) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Quick Batch Roll Generator
                </h3>
                <span className="text-xs text-slate-500">
                  (Instantly populate multiple rolls with auto-incremented serials)
                </span>
              </div>
              <button
                type="button"
                onClick={handleApplyBatchGeneration}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Generate {batchCount} Sequential Rolls
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Roll Count</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={batchCount}
                  onChange={e => setBatchCount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Color Name</label>
                <input
                  type="text"
                  value={batchColor}
                  onChange={e => setBatchColor(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Lot Number</label>
                <input
                  type="text"
                  value={batchLot}
                  onChange={e => setBatchLot(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Weight / Roll (KG)</label>
                <input
                  type="number"
                  step="0.1"
                  value={batchWeight}
                  onChange={e => setBatchWeight(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Storage Rack</label>
                <select
                  value={batchRack}
                  onChange={e => setBatchRack(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {racks.map(rack => (
                    <option key={rack.id} value={rack.name}>
                      {rack.name} ({rack.zone.split('-')[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">GSM</label>
                <input
                  type="number"
                  value={batchGsm}
                  onChange={e => setBatchGsm(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Quality Status</label>
                <select
                  value={batchStatus}
                  onChange={e => setBatchStatus(e.target.value as QualityStatus)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="Approved">Approved</option>
                  <option value="Under QC">Under QC</option>
                  <option value="Inspected">Inspected</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Shaded">Shaded</option>
                </select>
              </div>
            </div>
          </div>

          {/* Roll Entry Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  2. Rolls in this Consignment ({rollRows.length} Rolls)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Roll numbers are strictly unique per PO and increment automatically.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={rollRows.length === 0}
                  onClick={() => {
                    const rollsToPrint = rollRows.map(convertRowToFabricRoll);
                    setLabelModalRolls(rollsToPrint);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
                  title="Generate QR code and barcode stickers for all rolls"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Print All Labels ({rollRows.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddSingleRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Another Roll
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Roll Serial No</th>
                    <th className="py-2.5 px-3">Color</th>
                    <th className="py-2.5 px-3">Fabric Type</th>
                    <th className="py-2.5 px-3">GSM</th>
                    <th className="py-2.5 px-3">Lot No</th>
                    <th className="py-2.5 px-3">Weight (KG) *</th>
                    <th className="py-2.5 px-3">Rack No *</th>
                    <th className="py-2.5 px-3">Width</th>
                    <th className="py-2.5 px-3">QC Status</th>
                    <th className="py-2.5 px-3 text-center">Print Label</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rollRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        No rolls in this consignment yet. Click "Generate Sequential Rolls" or "Add Another Roll".
                      </td>
                    </tr>
                  ) : (
                    rollRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        {/* Auto Roll No (read-only per PO serial requirement) */}
                        <td className="py-2 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                          <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {row.rollNo}
                          </span>
                        </td>

                        {/* Color */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.color}
                            onChange={e => handleUpdateRow(idx, 'color', e.target.value)}
                            className="w-28 px-2 py-1 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-slate-900 text-xs"
                          />
                        </td>

                        {/* Fabric Type */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.fabricType}
                            onChange={e => handleUpdateRow(idx, 'fabricType', e.target.value)}
                            className="w-28 px-2 py-1 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-slate-900 text-xs"
                          />
                        </td>

                        {/* GSM */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={row.gsm}
                            onChange={e => handleUpdateRow(idx, 'gsm', Number(e.target.value))}
                            className="w-16 px-2 py-1 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-slate-900 font-mono text-xs"
                          />
                        </td>

                        {/* Lot No */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.lotNo}
                            onChange={e => handleUpdateRow(idx, 'lotNo', e.target.value)}
                            className="w-24 px-2 py-1 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-slate-900 font-mono text-xs"
                          />
                        </td>

                        {/* Weight */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            required
                            value={row.weight}
                            onChange={e => handleUpdateRow(idx, 'weight', Number(e.target.value))}
                            className="w-20 px-2 py-1 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 font-mono font-bold text-slate-900 text-xs text-right"
                          />
                        </td>

                        {/* Rack No */}
                        <td className="py-2 px-3">
                          <select
                            value={row.rackNo}
                            onChange={e => handleUpdateRow(idx, 'rackNo', e.target.value)}
                            className="w-28 px-2 py-1 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-slate-900 text-xs"
                          >
                            {racks.map(rk => (
                              <option key={rk.id} value={rk.name}>
                                {rk.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Width */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.width}
                            onChange={e => handleUpdateRow(idx, 'width', e.target.value)}
                            className="w-16 px-2 py-1 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-slate-900 text-xs font-mono"
                          />
                        </td>

                        {/* QC Status */}
                        <td className="py-2 px-3">
                          <select
                            value={row.qualityStatus}
                            onChange={e => handleUpdateRow(idx, 'qualityStatus', e.target.value as QualityStatus)}
                            className="w-24 px-2 py-1 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-slate-900 text-xs"
                          >
                            <option value="Approved">Approved</option>
                            <option value="Under QC">Under QC</option>
                            <option value="Inspected">Inspected</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Shaded">Shaded</option>
                          </select>
                        </td>

                        {/* Print Label Action */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setLabelModalSingleRoll(convertRowToFabricRoll(row))}
                            title="Generate and Print QR / Barcode Sticker for this Roll"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors whitespace-nowrap"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Print Label</span>
                          </button>
                        </td>

                        {/* Delete Row */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Remove Roll"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t border-slate-200 text-slate-900 font-mono">
                  <tr>
                    <td colSpan={5} className="py-3 px-3 text-right font-sans">
                      Total Consignment Weight:
                    </td>
                    <td className="py-3 px-3 text-right text-blue-700 text-sm">
                      {totalConsignmentWeight.toFixed(2)} KG
                    </td>
                    <td colSpan={5} className="py-3 px-3 font-sans text-slate-500 font-normal">
                      {rollRows.length} Rolls to be added to {selectedPoNumber}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Additional Consignment Information & Submit */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Store Receiving Remarks / Vehicle No / Container No
              </label>
              <input
                type="text"
                placeholder="e.g. Delivered via Covered Van #DM-TA-4491, roll packing inspected"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => initializeRowsForPO(selectedPoNumber)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Reset Roll Rows
              </button>
              <button
                type="submit"
                disabled={rollRows.length === 0 || !canReceive}
                title={!canReceive ? 'Receiving permission required to log fabric rolls' : undefined}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Save &amp; Generate GRN Voucher</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Printable Challan Modal */}
      {viewingReceive && (
        <ReceiveChallanModal
          receive={viewingReceive}
          onClose={() => setViewingReceive(null)}
        />
      )}

      {/* Printable Roll Labels / QR & Barcode Sticker Modal */}
      {(labelModalSingleRoll || labelModalRolls) && (
        <RollLabelModal
          roll={labelModalSingleRoll}
          rolls={labelModalRolls}
          onClose={() => {
            setLabelModalSingleRoll(null);
            setLabelModalRolls(null);
          }}
        />
      )}
    </div>
  );
};
