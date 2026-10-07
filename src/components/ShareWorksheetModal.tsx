import React, { useState } from 'react';
import type { Worksheet } from '../types';
import { X, Copy, Check, QrCode, Share2, ExternalLink, Smartphone } from 'lucide-react';

interface ShareWorksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  worksheet: Worksheet;
}

export const ShareWorksheetModal: React.FC<ShareWorksheetModalProps> = ({
  isOpen,
  onClose,
  worksheet,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate shareable URL
  const baseUrl = window.location.origin + window.location.pathname;
  const shareUrl = `${baseUrl}?worksheet=${worksheet.id}&mode=student`;
  const pinCode = worksheet.id.replace(/[^0-9]/g, '').slice(0, 6) || '739215';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // QR Code SVG representation (using quick API or clean SVG)
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    shareUrl
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <Share2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Chia sẻ phiếu cho học sinh</h3>
          <p className="text-xs text-slate-500 mt-1">
            {worksheet.title} ({worksheet.subject} - {worksheet.grade})
          </p>
        </div>

        {/* QR Code preview for classroom projection */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center mb-6">
          <div className="w-40 h-40 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs mx-auto mb-3 flex items-center justify-center">
            <img
              src={qrApiUrl}
              alt="Mã QR làm bài"
              className="w-full h-full object-contain rounded-lg"
              loading="lazy"
            />
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 font-medium">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Học sinh quét mã QR bằng điện thoại / iPad để làm bài</span>
          </div>
        </div>

        {/* Copy Link */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Đường dẫn (Link) làm bài trực tiếp:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition-transform shadow-2xs"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Đã sao chép!' : 'Sao chép'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl flex items-center justify-between text-xs text-emerald-900">
            <span>Mã PIN phòng học trực tiếp:</span>
            <span className="font-mono font-bold text-sm tracking-wider bg-white px-2 py-0.5 rounded border border-emerald-200">
              {pinCode}
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
