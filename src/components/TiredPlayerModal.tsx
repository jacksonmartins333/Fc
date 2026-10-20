import React from 'react';
import { Player, Team } from '../types';
import { HeartCrack, UserMinus, BatteryLow, AlertTriangle, X } from 'lucide-react';

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

        <p className="text-sm text-slate-600 mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3">
          ⚡ <strong>Ajuste Automático:</strong> Se houver reservas no banco, um substituto entrará automaticamente para manter o <strong>{team.name}</strong> completo. Caso contrário, o time será ajustado para a próxima partida.
        </p>

        <div className="space-y-2.5 mb-6">
          <button
            onClick={() => {
              onConfirm(player.id, team.id, 'tired');
              onClose();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <BatteryLow className="text-amber-500 group-hover:scale-110 transition-transform" size={20} />
              <div>
                <span className="font-bold text-slate-800 block text-sm">Cansou / Fôlego</span>
                <span className="text-xs text-slate-500">Sai para descansar no banco e pode retornar mais tarde</span>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md">
              Descansar
            </span>
          </button>

          <button
            onClick={() => {
              onConfirm(player.id, team.id, 'injured');
              onClose();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-red-400 hover:bg-red-50/50 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-500 group-hover:scale-110 transition-transform" size={20} />
              <div>
                <span className="font-bold text-slate-800 block text-sm">Machucou / Dor</span>
                <span className="text-xs text-slate-500">Lesionou e não joga mais nas partidas de hoje</span>
              </div>
            </div>
            <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-md">
              Lesão
            </span>
          </button>

          <button
            onClick={() => {
              onConfirm(player.id, team.id, 'left');
              onClose();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition text-left group"
          >
            <div className="flex items-center gap-3">
              <UserMinus className="text-slate-500 group-hover:scale-110 transition-transform" size={20} />
              <div>
                <span className="font-bold text-slate-800 block text-sm">Precisou Ir Embora</span>
                <span className="text-xs text-slate-500">Sai da lista e desocupa a vaga definitivamente hoje</span>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
              Foi embora
            </span>
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-100 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
