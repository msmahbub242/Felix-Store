import React, { useState } from 'react';
import { FabricRoll } from '../types/fabric';
import { X, Printer, QrCode, Tag, Check, SlidersHorizontal } from 'lucide-react';
import { QRCodeComponent } from './QRCodeComponent';

interface RollLabelModalProps {
  roll?: FabricRoll | null;
  rolls?: FabricRoll[] | null;
  onClose: () => void;
  title?: string;
}

export const RollLabelModal: React.FC<RollLabelModalProps> = ({
  roll,
  rolls,
  onClose,
  title,
}) => {
  // Normalize rolls array
  const allRolls: FabricRoll[] = rolls && rolls.length > 0 ? rolls : roll ? [roll] : [];

  const [selectedRollIndex, setSelectedRollIndex] = useState<number | 'ALL'>('ALL');
  const [showQrCode, setShowQrCode] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [layoutMode, setLayoutMode] = useState<'thermal' | 'grid'>('thermal');

  if (allRolls.length === 0) return null;

  const displayedRolls =
    selectedRollIndex === 'ALL'
      ? allRolls
      : [allRolls[selectedRollIndex as number]].filter(Boolean);

  const handlePrint = () => {
    window.print();
  };

  const getQRContent = (r: FabricRoll) => {
    return JSON.stringify({
      po: r.poNumber,
      roll: r.rollNo,
      buyer: r.buyer,
      color: r.color,
      lot: r.lotNo,
      gsm: r.gsm,
      wt: r.originalWeight,
      rack: r.rackNo,
      ch: r.challanNo,
      dt: r.receiveDate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[95vh] flex flex-col">
        {/* Header - No print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 no-print shrink-0">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {title || (allRolls.length > 1 ? `Print Roll Labels & QR Stickers (${allRolls.length} Rolls)` : `Roll Label: ${allRolls[0]?.rollNo}`)}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                PO: {allRolls[0]?.poNumber} · {allRolls[0]?.buyer}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Controls - No print */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs no-print shrink-0">
          {/* Roll Selector if multiple */}
          {allRolls.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Select Rolls:</span>
              <select
                value={selectedRollIndex}
                onChange={e =>
                  setSelectedRollIndex(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                }
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded font-mono text-xs font-semibold text-slate-800"
              >
                <option value="ALL">All {allRolls.length} Rolls (Batch Print)</option>
                {allRolls.map((r, i) => (
                  <option key={r.id || i} value={i}>
                    Roll {r.rollNo} ({r.color} - {r.originalWeight} KG)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Toggles */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={showQrCode}
                onChange={e => setShowQrCode(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Include 2D QR Code</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={showBarcode}
                onChange={e => setShowBarcode(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Include Barcode</span>
            </label>

            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded">
              <button
                type="button"
                onClick={() => setLayoutMode('thermal')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  layoutMode === 'thermal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Thermal Sticker (4x3")
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('grid')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  layoutMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Sheet Grid (2 Col)
              </button>
            </div>
          </div>
        </div>

        {/* Printable Stickers Area */}
        <div className="p-6 overflow-y-auto bg-slate-100/70 print:p-0 print:bg-white flex-1">
          <div
            className={
              layoutMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3'
                : 'space-y-6 max-w-xl mx-auto print:space-y-4 print:max-w-none'
            }
          >
            {displayedRolls.map((r, idx) => (
              <div
                key={r.id || idx}
                className="bg-white border-2 border-slate-900 rounded-lg p-4 text-slate-900 shadow-sm print:border-black print:rounded-none print:shadow-none print:break-inside-avoid print:page-break-inside-avoid"
              >
                {/* Sticker Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 block">
                      TEXSTORE WAREHOUSE MANAGEMENT
                    </span>
                    <h4 className="text-xs font-black tracking-tight uppercase">
                      FABRIC ROLL IDENTIFICATION LABEL
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-600 font-mono block">
                      Date: {r.receiveDate}
                    </span>
                    <span className="text-xs font-black font-mono uppercase bg-slate-900 text-white px-2 py-0.5 rounded">
                      {r.rackNo}
                    </span>
                  </div>
                </div>

                {/* Prominent PO and Roll Serial */}
                <div className="grid grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded border border-slate-300 mb-2.5 items-center">
                  <div className="col-span-7">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">
                      Purchase Order (PO)
                    </span>
                    <span className="text-base font-black font-mono text-slate-900 tracking-tight block">
                      {r.poNumber}
                    </span>
                    <span className="text-[10px] text-slate-600 truncate block">
                      {r.buyer} · {r.style}
                    </span>
                  </div>
                  <div className="col-span-5 text-right border-l border-slate-200 pl-2">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">
                      Roll Serial No
                    </span>
                    <span className="text-2xl font-black font-mono text-blue-700 tracking-tight block">
                      {r.rollNo}
                    </span>
                  </div>
                </div>

                {/* Fabric Specifications & QR Code Grid */}
                <div className="grid grid-cols-12 gap-3 mb-2.5 items-center">
                  {/* Left Specs */}
                  <div className={showQrCode ? 'col-span-8 space-y-1 text-xs' : 'col-span-12 space-y-1 text-xs'}>
                    <div className="truncate">
                      <span className="text-slate-500 text-[11px]">Fabric:</span>{' '}
                      <span className="font-semibold text-slate-900">{r.item}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500">Color:</span>{' '}
                        <span className="font-bold text-slate-900">{r.color}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Lot No:</span>{' '}
                        <span className="font-bold font-mono text-slate-900">{r.lotNo}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500">GSM / Width:</span>{' '}
                        <span className="font-semibold font-mono text-slate-800">
                          {r.gsm} / {r.width}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">QC Status:</span>{' '}
                        <span className="font-bold text-slate-900">
                          {r.qualityStatus} (Grade {r.shadeGrade || 'A'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right QR Code */}
                  {showQrCode && (
                    <div className="col-span-4 flex flex-col items-center justify-center text-center pl-1">
                      <QRCodeComponent value={getQRContent(r)} size={88} />
                      <span className="text-[8px] font-mono text-slate-500 mt-0.5 tracking-tight uppercase">
                        Scan for Trace
                      </span>
                    </div>
                  )}
                </div>

                {/* Weight Strip */}
                <div className="border-t border-b border-slate-300 py-1.5 mb-2 grid grid-cols-2 gap-2 text-center bg-slate-50">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">
                      Received Gross Weight
                    </span>
                    <span className="text-lg font-black font-mono text-slate-900">
                      {r.originalWeight.toFixed(2)} KG
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-semibold">
                      Assigned Storage Bin
                    </span>
                    <span className="text-lg font-black font-mono text-slate-900 uppercase">
                      {r.rackNo}
                    </span>
                  </div>
                </div>

                {/* Barcode & Footer Traceability */}
                {showBarcode && (
                  <div className="text-center pt-0.5">
                    <div className="font-mono tracking-wider text-[10px] font-bold text-slate-700 mb-0.5">
                      *{r.poNumber}-{r.rollNo}*
                    </div>
                    {/* Simulated crisp high-contrast linear barcode */}
                    <div className="flex justify-center items-center gap-[2px] h-7 px-3 bg-white border border-slate-200">
                      {Array.from({ length: 44 }).map((_, barIdx) => {
                        const seed = (barIdx * 11 + idx * 7) % 5;
                        return (
                          <div
                            key={barIdx}
                            className={`h-full ${
                              seed === 0
                                ? 'w-1 bg-black'
                                : seed === 1 || seed === 3
                                ? 'w-0.5 bg-black'
                                : 'w-0.5 bg-transparent'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-200">
                  <span>Challan: {r.challanNo}</span>
                  <span className="truncate max-w-[150px]">{r.supplier}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions - No print */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200 no-print shrink-0">
          <div className="text-xs text-slate-500 font-mono">
            Ready to print: <span className="font-bold text-slate-900">{displayedRolls.length} sticker(s)</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print {displayedRolls.length > 1 ? `All ${displayedRolls.length} Stickers` : 'Roll Sticker'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
