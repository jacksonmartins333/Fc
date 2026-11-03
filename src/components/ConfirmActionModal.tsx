import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  icon?: React.ReactNode;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmActionModal({
  isOpen,
  title,
  description,
  confirmLabel,
  confirmVariant = 'danger',
  icon,
  onClose,
  onConfirm,
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  const btnBg = 
    confirmVariant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20'
      : confirmVariant === 'warning'
      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20'
      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-5">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
            confirmVariant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
          }`}>
            {icon || <AlertTriangle size={26} />}
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            {title}
          </h3>
          <p className="text-slate-600 text-sm mt-2 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition cursor-pointer flex items-center justify-center gap-1.5 ${btnBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
