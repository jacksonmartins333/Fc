import React from 'react';
import { Player, Team } from '../types';
import { HeartCrack, UserMinus, BatteryLow, AlertTriangle, X, ListOrdered } from 'lucide-react';

interface TiredPlayerModalProps {
  isOpen: boolean;
  player: Player | null;
  team: Team | null;
  onClose: () => void;
  onConfirm: (playerId: string, teamId: string, reason: 'tired' | 'injured' | 'left') => void;
}

export function TiredPlayerModal({
  isOpen,
  player,
  team,
  onClose,
  onConfirm
}: TiredPlayerModalProps) {
  if (!isOpen || !player || !team) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-800 border border-slate-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <HeartCrack size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">{player.name} vai sair do time?</h3>
              <p className="text-xs text-slate-500 font-medium">
                Atualmente no <strong className="text-slate-800">{team.name}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="text-xs text-slate-600 mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
            <ListOrdered size={16} className="text-amber-700 shrink-0" />
            <span>Regra de Ajuste da Pelada:</span>
          </div>
          <p>
            Ao descansar, <strong>{player.name}</strong> sai do <strong>{team.name}</strong> e vai para o <strong>último da lista</strong> de espera, e o próximo da fila assume o lugar para manter o time completo!
          </p>
        </div>

        <div className="space-y-2.5 mb-6">
          <button
            onClick={() => {
              onConfirm(player.id, team.id, 'tired');
              onClose();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition text-left group cursor-pointer active:scale-98"
          >
            <div className="flex items-center gap-3">
              <BatteryLow className="text-amber-500 group-hover:scale-110 transition-transform" size={20} />
              <div>
                <span className="font-bold text-slate-800 block text-sm">Cansou / Fôlego</span>
                <span className="text-xs text-slate-500">
                  Vai para o último da lista de espera e o próximo da fila assume
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md shrink-0">
              Descansar
            </span>
          </button>

          <button
            onClick={() => {
              onConfirm(player.id, team.id, 'injured');
              onClose();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-red-400 hover:bg-red-50/50 transition text-left group cursor-pointer active:scale-98"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-500 group-hover:scale-110 transition-transform" size={20} />
              <div>
                <span className="font-bold text-slate-800 block text-sm">Machucou / Dor</span>
                <span className="text-xs text-slate-500">
                  Lesionou e não joga mais nas partidas de hoje
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-md shrink-0">
              Lesão
            </span>
          </button>

          <button
            onClick={() => {
              onConfirm(player.id, team.id, 'left');
              onClose();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition text-left group cursor-pointer active:scale-98"
          >
            <div className="flex items-center gap-3">
              <UserMinus className="text-slate-500 group-hover:scale-110 transition-transform" size={20} />
              <div>
                <span className="font-bold text-slate-800 block text-sm">Precisou Ir Embora</span>
                <span className="text-xs text-slate-500">
                  Desocupa a vaga definitivamente hoje
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md shrink-0">
              Foi embora
            </span>
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-100 transition cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
