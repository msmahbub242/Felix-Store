import React from 'react';
import { FabricIssueRecord } from '../types/fabric';
import { X, Printer, ArrowUpRight } from 'lucide-react';

interface IssueSlipModalProps {
  issue: FabricIssueRecord | null;
  onClose: () => void;
}

export const IssueSlipModal: React.FC<IssueSlipModalProps> = ({ issue, onClose }) => {
  if (!issue) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 no-print">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-slate-900">Cutting Room Fabric Issue Requisition Slip</span>
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
              <p className="text-xs text-slate-500">Fabric Store Issuance & Cutting Floor Requisition</p>
              <div className="text-xs text-slate-600 mt-1">Authorized Store Dispatch Document</div>
            </div>
            <div className="text-right">
              <span className="inline-block bg-amber-50 text-amber-900 border border-amber-200 text-xs px-2.5 py-1 rounded font-mono font-bold uppercase mb-1">
                STORE ISSUE NOTE
              </span>
              <div className="text-sm font-mono font-bold text-slate-900">{issue.issueSlipNo}</div>
              <div className="text-xs text-slate-500 font-mono">Date: {issue.issueDate}</div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 text-xs">
            <div>
              <span className="text-slate-500 block">PO Number:</span>
              <span className="font-bold text-sm text-slate-900 font-mono">{issue.poNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Buyer:</span>
              <span className="font-semibold text-slate-900">{issue.buyer}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Style:</span>
              <span className="font-semibold text-slate-900">{issue.style}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Issued To:</span>
              <span className="font-semibold text-slate-900 text-amber-800">{issue.issuedTo}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Fabric Spec:</span>
              <span className="font-medium text-slate-900">{issue.item}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Purpose:</span>
              <span className="font-medium text-slate-900">{issue.purpose}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Issued By:</span>
              <span className="font-medium text-slate-900">{issue.issuedBy}</span>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="mb-6 overflow-x-auto">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Issued Rolls & Weight Deduction Details</h4>
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">SL</th>
                  <th className="py-2 px-3">Roll No</th>
                  <th className="py-2 px-3">Lot No</th>
                  <th className="py-2 px-3">Color</th>
                  <th className="py-2 px-3">Rack</th>
                  <th className="py-2 px-3 text-right">Prev Weight (KG)</th>
                  <th className="py-2 px-3 text-right text-amber-800">Issued (KG)</th>
                  <th className="py-2 px-3 text-right">Balance in Store</th>
                  <th className="py-2 px-3 text-center">Issue Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {issue.items.map((item, idx) => (
                  <tr key={item.rollId || idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{item.rollNo}</td>
                    <td className="py-2 px-3 text-slate-600">{item.lotNo}</td>
                    <td className="py-2 px-3 font-sans text-slate-800">{item.color}</td>
                    <td className="py-2 px-3 text-slate-600">{item.rackNo}</td>
                    <td className="py-2 px-3 text-right text-slate-600">{item.previousWeight.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-bold text-amber-900">{item.issuedWeight.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {item.remainingWeight > 0 ? `${item.remainingWeight.toFixed(2)} KG` : 'Exhausted (0)'}
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      <span className={`text-[11px] font-medium ${item.isFullRoll ? 'text-purple-700' : 'text-blue-700'}`}>
                        {item.isFullRoll ? 'Full Roll' : 'Partial Qty'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t border-slate-200 text-slate-900 font-mono">
                <tr>
                  <td colSpan={6} className="py-2 px-3 text-right font-sans">Total Dispatched Weight:</td>
                  <td className="py-2 px-3 text-right text-amber-900 text-sm">{issue.totalIssuedWeight.toFixed(2)} KG</td>
                  <td colSpan={2} className="py-2 px-3 text-right font-sans text-xs">{issue.rollsCount} Rolls Handled</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {issue.remarks && (
            <div className="text-xs text-slate-600 mb-8 p-3 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-slate-700">Remarks:</span> {issue.remarks}
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 pt-8 mt-6 border-t border-slate-200 text-center text-xs text-slate-500">
            <div>
              <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
              <div>Store Dispatcher</div>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
              <div>Cutting Master / Receiver</div>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
              <div>Factory Floor Manager</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200 no-print">
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
            Print Issue Slip
          </button>
        </div>
      </div>
    </div>
  );
};
