import React, { useState } from 'react';
import { FabricReceiveRecord, FabricRoll } from '../types/fabric';
import { X, Printer, FileText, CheckCircle, QrCode, Tag } from 'lucide-react';
import { RollLabelModal } from './RollLabelModal';

interface ReceiveChallanModalProps {
  receive: FabricReceiveRecord | null;
  onClose: () => void;
}

export const ReceiveChallanModal: React.FC<ReceiveChallanModalProps> = ({ receive, onClose }) => {
  const [selectedRollForLabel, setSelectedRollForLabel] = useState<FabricRoll | null>(null);
  const [printAllRolls, setPrintAllRolls] = useState(false);

  if (!receive) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-700" />
            <span className="font-semibold text-slate-900">Goods Receiving Note (GRN) / Challan</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 print:p-4 text-slate-900 bg-white">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">FELIX FABRIC STORE MANAGEMENT</h2>
              <p className="text-xs text-slate-500">Central Fabric Receiving & Quality Inspection Yard</p>
              <div className="text-xs text-slate-600 mt-1">Industrial Area, Sector 7, Warehouse Unit 3</div>
            </div>
            <div className="text-right">
              <span className="inline-block bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded font-mono font-bold uppercase mb-1">
                MRR / GRN VOUCHER
              </span>
              <div className="text-sm font-mono font-bold text-slate-900">Challan: {receive.challanNo}</div>
              <div className="text-xs text-slate-500 font-mono">Date: {receive.receivingDate}</div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 text-xs">
            <div>
              <span className="text-slate-500 block">Purchase Order:</span>
              <span className="font-bold text-sm text-slate-900 font-mono">{receive.poNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Buyer:</span>
              <span className="font-semibold text-slate-900">{receive.buyer}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Style Ref:</span>
              <span className="font-semibold text-slate-900">{receive.style}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Supplier:</span>
              <span className="font-semibold text-slate-900 truncate">{receive.supplier}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Fabric Specification:</span>
              <span className="font-medium text-slate-900">{receive.item}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Received By:</span>
              <span className="font-medium text-slate-900">{receive.receivedBy}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Consignment Total:</span>
              <span className="font-bold text-sm font-mono text-blue-700">{receive.totalWeight.toFixed(2)} KG ({receive.rollCount} Rolls)</span>
            </div>
          </div>

          {/* Rolls Table */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Itemized Roll Receiving Breakdown</h4>
              <button
                type="button"
                onClick={() => setPrintAllRolls(true)}
                className="no-print inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Print All Roll Stickers ({receive.rolls.length})</span>
              </button>
            </div>
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">SL</th>
                  <th className="py-2 px-3">Roll Serial No</th>
                  <th className="py-2 px-3">Color</th>
                  <th className="py-2 px-3">Lot No</th>
                  <th className="py-2 px-3">GSM / Width</th>
                  <th className="py-2 px-3">Rack No</th>
                  <th className="py-2 px-3 text-right">Weight (KG)</th>
                  <th className="py-2 px-3 text-center">Quality Status</th>
                  <th className="py-2 px-3 text-center no-print">Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {receive.rolls.map((roll, idx) => (
                  <tr key={roll.id || idx} className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-1.5 px-3 font-bold text-slate-900">{roll.rollNo}</td>
                    <td className="py-1.5 px-3 font-sans text-slate-800">{roll.color}</td>
                    <td className="py-1.5 px-3 text-slate-600">{roll.lotNo}</td>
                    <td className="py-1.5 px-3 text-slate-600">{roll.gsm} / {roll.width}</td>
                    <td className="py-1.5 px-3 font-semibold text-slate-700">{roll.rackNo}</td>
                    <td className="py-1.5 px-3 text-right font-bold text-slate-900">{roll.originalWeight.toFixed(2)}</td>
                    <td className="py-1.5 px-3 text-center font-sans">
                      <span className="text-[11px] font-medium text-slate-700">{roll.qualityStatus}</span>
                    </td>
                    <td className="py-1.5 px-3 text-center no-print">
                      <button
                        type="button"
                        onClick={() => setSelectedRollForLabel(roll)}
                        title="Print Barcode & QR Label for this Roll"
                        className="p-1 text-slate-500 hover:text-blue-700 rounded"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t border-slate-200 text-slate-900 font-mono">
                <tr>
                  <td colSpan={6} className="py-2 px-3 text-right font-sans">Total Received:</td>
                  <td className="py-2 px-3 text-right text-blue-800 text-sm">{receive.totalWeight.toFixed(2)} KG</td>
                  <td colSpan={2} className="py-2 px-3 text-center font-sans text-xs">{receive.rollCount} Rolls Total</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {receive.remarks && (
            <div className="text-xs text-slate-600 mb-8 p-3 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-slate-700">Remarks:</span> {receive.remarks}
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 pt-8 mt-6 border-t border-slate-200 text-center text-xs text-slate-500">
            <div>
              <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
              <div>Storekeeper / Received By</div>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
              <div>Quality Inspector / Lab QA</div>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
              <div>Warehouse In-Charge</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200 no-print">
          <button
            onClick={() => setPrintAllRolls(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <QrCode className="w-4 h-4" />
            <span>Print Roll QR Stickers ({receive.rolls.length})</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
            >
              <Printer className="w-4 h-4" />
              Print GRN Slip
            </button>
          </div>
        </div>
      </div>

      {/* Roll Labels Modal */}
      {(selectedRollForLabel || printAllRolls) && (
        <RollLabelModal
          roll={selectedRollForLabel}
          rolls={printAllRolls ? receive.rolls : undefined}
          title={`Roll Stickers for Challan ${receive.challanNo} (${receive.poNumber})`}
          onClose={() => {
            setSelectedRollForLabel(null);
            setPrintAllRolls(false);
          }}
        />
      )}
    </div>
  );
};

