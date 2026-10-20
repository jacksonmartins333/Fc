import React from 'react';
import { AlertTriangle, Trash2, CalendarX, X } from 'lucide-react';
import { Player } from '../types';

interface ConfirmDeletePlayerModalProps {
  isOpen: boolean;
  player: Player | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => void;
  onJustRemoveFromToday?: (id: string) => void;
}

export function ConfirmDeletePlayerModal({
  isOpen,
  player,
  onClose,
  onConfirmDelete,
  onJustRemoveFromToday,
}: ConfirmDeletePlayerModalProps) {
  if (!isOpen || !player) return null;

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
          <div className="bg-red-100 text-red-600 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
            <Trash2 size={26} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            Remover Jogador
          </h3>
          <p className="text-slate-600 text-sm mt-1">
            Como você deseja remover <strong className="text-slate-900">{player.name}</strong>?
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {/* Opção 1: Apenas sair da lista de hoje */}
          {player.isPresent && onJustRemoveFromToday && (
            <button
              onClick={() => {
                onJustRemoveFromToday(player.id);
                onClose();
              }}
              className="w-full text-left p-3.5 rounded-xl border-2 border-amber-200 bg-amber-50/70 hover:bg-amber-100/70 transition flex items-start gap-3 group"
            >
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5">
                <CalendarX size={18} />
              </div>
              <div className="flex-1">
                <div className="font-bold text-amber-900 text-sm group-hover:text-amber-950">
                  Apenas sair da lista de hoje (Ausente)
                </div>
                <div className="text-xs text-amber-700 mt-0.5">
                  Ele continua cadastrado no elenco, mas não jogará a partida de hoje.
                </div>
              </div>
            </button>
          )}

          {/* Opção 2: Excluir definitivamente */}
          <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/50">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 text-red-700 rounded-lg shrink-0 mt-0.5">
                <AlertTriangle size={18} />
              </div>
              <div className="flex-1">
                <div className="font-bold text-red-900 text-sm">
                  Excluir definitivamente do elenco
                </div>
                <div className="text-xs text-red-700 mt-0.5">
                  Use se a pessoa saiu do grupo da pelada e não vai mais jogar. Seus dados e estatísticas serão removidos.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete(player.id);
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5"
          >
            <Trash2 size={16} /> Excluir do Elenco
          </button>
        </div>
      </div>
    </div>
  );
}
