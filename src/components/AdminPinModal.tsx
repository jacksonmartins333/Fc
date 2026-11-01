import React, { useState, useEffect } from 'react';
import { Lock, Key, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../store/AppContext';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 3 * 60 * 1000; // 3 minutes

export function AdminPinModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Acesso de Organizador',
  description = 'Digite sua senha de organizador para gerenciar.'
}: AdminPinModalProps) {
  const { unlockAdmin } = useAppContext();
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    return Number(sessionStorage.getItem('admin_failed_attempts') || 0);
  });
  const [lockoutUntil, setLockoutUntil] = useState<number>(() => {
    return Number(sessionStorage.getItem('admin_lockout_until') || 0);
  });
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState(false);

  // Check lockout on mount and tick countdown
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      if (lockoutUntil > now) {
        setSecondsRemaining(Math.ceil((lockoutUntil - now) / 1000));
      } else {
        setSecondsRemaining(0);
        if (lockoutUntil > 0) {
          sessionStorage.removeItem('admin_lockout_until');
          sessionStorage.removeItem('admin_failed_attempts');
          setLockoutUntil(0);
          setFailedAttempts(0);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  if (!isOpen) return null;

  const isLocked = secondsRemaining > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || isVerifying || !pin.trim()) return;

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const isSuccess = await unlockAdmin(pin);
      if (isSuccess) {
        setFailedAttempts(0);
        sessionStorage.removeItem('admin_failed_attempts');
        sessionStorage.removeItem('admin_lockout_until');
        setPin('');
        onClose();
        if (onSuccess) onSuccess();
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        sessionStorage.setItem('admin_failed_attempts', String(nextAttempts));
        setPin('');

        if (nextAttempts >= MAX_ATTEMPTS) {
          const lockTime = Date.now() + LOCKOUT_DURATION_MS;
          setLockoutUntil(lockTime);
          sessionStorage.setItem('admin_lockout_until', String(lockTime));
          setErrorMessage(`Muitas tentativas incorretas. Painel bloqueado por segurança.`);
        } else {
          const remaining = MAX_ATTEMPTS - nextAttempts;
          setErrorMessage(`Senha incorreta. ${remaining} ${remaining === 1 ? 'tentativa restante' : 'tentativas restantes'}.`);
        }
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative border border-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-lg transition min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div className="text-center pt-2">
          <div className="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Lock size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <p className="text-slate-500 text-sm mt-1 mb-5">{description}</p>
        </div>

        {isLocked ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center my-3">
            <AlertTriangle className="text-red-500 mx-auto mb-2" size={28} />
            <h4 className="text-red-800 font-semibold text-sm">Acesso temporariamente bloqueado</h4>
            <p className="text-red-600 text-xs mt-1">
              Proteção contra força bruta ativada. Aguarde para tentar novamente:
            </p>
            <div className="text-2xl font-bold font-mono text-red-700 mt-2">
              {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, '0')}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  inputMode="text"
                  autoFocus
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition outline-none ${
                    errorMessage 
                      ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-400' 
                      : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  disabled={isVerifying}
                />
              </div>
              {errorMessage && (
                <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1">
                  <AlertTriangle size={14} className="shrink-0" />
                  {errorMessage}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 active:bg-slate-100 transition min-h-[48px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isVerifying || !pin.trim()}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 transition shadow-md shadow-indigo-600/20 min-h-[48px] flex items-center justify-center gap-1.5"
              >
                <ShieldCheck size={18} />
                {isVerifying ? 'Verificando...' : 'Confirmar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
