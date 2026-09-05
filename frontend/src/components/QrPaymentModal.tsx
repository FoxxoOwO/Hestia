import React, { useEffect, useRef, useState } from 'react';
import { X, QrCode, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { DebtSettlementItem } from '../types';
import { useTranslation } from '../i18n';

interface QrPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlement: DebtSettlementItem | null;
}

export const QrPaymentModal: React.FC<QrPaymentModalProps> = ({
  isOpen,
  onClose,
  settlement
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedIban, setCopiedIban] = useState(false);
  const [copiedSpayd, setCopiedSpayd] = useState(false);

  useEffect(() => {
    if (isOpen && settlement?.spayd_string && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        settlement.spayd_string,
        {
          width: 250,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        },
        (error) => {
          if (error) console.error('Failed to generate QR code:', error);
        }
      );
    }
  }, [isOpen, settlement]);

  if (!isOpen || !settlement) return null;

  const copyToClipboard = (text: string, type: 'iban' | 'spayd') => {
    navigator.clipboard.writeText(text);
    if (type === 'iban') {
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2000);
    } else {
      setCopiedSpayd(true);
      setTimeout(() => setCopiedSpayd(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {t('finance.qr_modal_title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('finance.qr_modal_desc')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-6 flex flex-col items-center">
          {/* QR Canvas Box */}
          <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200 flex items-center justify-center mb-5">
            <canvas ref={canvasRef} className="max-w-full h-auto rounded-lg" />
          </div>

          <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
            {/* Amount */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Částka k úhradě:</span>
              <span className="font-bold text-xl text-emerald-600 dark:text-emerald-400">
                {settlement.amount.toLocaleString('cs-CZ')} Kč
              </span>
            </div>

            {/* From -> To */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Platba:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {settlement.from_user_name} ➔ {settlement.to_user_name}
              </span>
            </div>

            {/* Account / IBAN */}
            {settlement.to_user_account && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Číslo účtu:</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                  {settlement.to_user_account}
                </span>
              </div>
            )}

            {settlement.to_user_iban && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">IBAN:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                    {settlement.to_user_iban}
                  </span>
                  <button
                    onClick={() => copyToClipboard(settlement.to_user_iban!, 'iban')}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500"
                    title="Kopírovat IBAN"
                  >
                    {copiedIban ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            <div className="text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Standard Czech SPAYD (Short Payment Descriptor) kompatibilní se všemi bankami v ČR.</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => copyToClipboard(settlement.spayd_string, 'spayd')}
            className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {copiedSpayd ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copiedSpayd ? 'Kód zkopírován' : 'Zkopírovat SPAYD kód'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-2xl shadow-md transition-all text-sm"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
