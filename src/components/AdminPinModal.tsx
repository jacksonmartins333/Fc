import React, { useState } from 'react';
import { Lock, Key, X } from 'lucide-react';
import { useAppContext } from '../store/AppContext';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export function AdminPinModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Acesso de Organizador',
  description = 'Digite a senha do organizador para realizar esta alteração.'
}: AdminPinModalProps) {
  const { unlockAdmin } = useAppContext();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockAdmin(pin)) {
      setError(false);
      setPin('');
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <p className="text-slate-500 text-sm mt-1 mb-5">{description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                placeholder="Senha / PIN (ex: 162222)"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(false);
                }}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm ${
                  error 
                    ? 'border-red-400 bg-red-50 focus:ring-red-500' 
                    : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
                } outline-none transition`}
              />
            </div>
            {error && (
              <p className="text-xs text-red-600 mt-1.5 font-medium">
                Senha incorreta. A senha padrão do organizador é 162222.
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
