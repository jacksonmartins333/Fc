import React, { useState } from 'react';
import { Match, Team } from '../types';
import { Trophy, ArrowRight, RotateCcw, Swords, CheckCircle2, AlertCircle } from 'lucide-react';

interface MatchFinishModalProps {
  isOpen: boolean;
  match: Match | null;
  winnerTeam: Team | null;
  loserTeam: Team | null;
  isDraw: boolean;
  nextChallenger: Team | null;
  onClose: () => void;
  onStartNextMatch: (advancingTeamId?: string) => void;
}

export function MatchFinishModal({
  isOpen,
  match,
  winnerTeam,
  loserTeam,
  isDraw,
  nextChallenger,
  onClose,
  onStartNextMatch
}: MatchFinishModalProps) {
  const [selectedDrawAdvancingId, setSelectedDrawAdvancingId] = useState<string | null>(null);

  if (!isOpen || !match) return null;

  const effectiveWinnerId = isDraw ? selectedDrawAdvancingId : winnerTeam?.id;
  const effectiveWinner = effectiveWinnerId === match.teamA.id ? match.teamA : effectiveWinnerId === match.teamB.id ? match.teamB : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl max-w-lg w-full p-6 md:p-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Trophy size={36} />
          </div>
          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
            Partida #{match.matchNumber || 1} Encerrada
          </span>
          <h3 className="text-2xl md:text-3xl font-black mt-1">Fim de Jogo!</h3>
        </div>

        {/* Placar Final */}
        <div className="bg-slate-800/80 rounded-2xl p-5 mb-6 border border-slate-700/60 flex items-center justify-around text-center">
          <div className="flex-1">
            <h4 className="font-bold text-sm md:text-base text-slate-200 truncate">{match.teamA.name}</h4>
            <div className={`text-4xl md:text-5xl font-black font-mono mt-1 ${
              match.teamA.score > match.teamB.score ? 'text-emerald-400' : 'text-slate-300'
            }`}>
              {match.teamA.score}
            </div>
            {winnerTeam?.id === match.teamA.id && (
              <span className="inline-block mt-1 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Vencedor
              </span>
            )}
          </div>

          <div className="text-2xl font-black text-slate-500 px-3">X</div>

          <div className="flex-1">
            <h4 className="font-bold text-sm md:text-base text-slate-200 truncate">{match.teamB.name}</h4>
            <div className={`text-4xl md:text-5xl font-black font-mono mt-1 ${
              match.teamB.score > match.teamA.score ? 'text-emerald-400' : 'text-slate-300'
            }`}>
              {match.teamB.score}
            </div>
            {winnerTeam?.id === match.teamB.id && (
              <span className="inline-block mt-1 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Vencedor
              </span>
            )}
          </div>
        </div>

        {/* Case 1: Empate */}
        {isDraw && !selectedDrawAdvancingId && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2">
              <AlertCircle size={18} />
              <span>Jogo empatado! Quem fica em campo?</span>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Pela regra da pelada ou pênaltis, escolha qual time continua para enfrentar o próximo da fila:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedDrawAdvancingId(match.teamA.id)}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 font-bold text-sm text-center text-slate-100 transition hover:border-emerald-500"
              >
                {match.teamA.name} Continua
              </button>
              <button
                onClick={() => setSelectedDrawAdvancingId(match.teamB.id)}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 font-bold text-sm text-center text-slate-100 transition hover:border-emerald-500"
              >
                {match.teamB.name} Continua
              </button>
            </div>
          </div>
        )}

        {/* Sequência da Próxima Partida (Rei da Quadra) */}
        {(!isDraw || selectedDrawAdvancingId) && (
          <div className="bg-slate-800/50 border border-emerald-500/30 rounded-2xl p-4 mb-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Swords size={16} />
              <span>Regra do Rei da Quadra (Vencedor Fica)</span>
            </div>

            <div className="flex items-center justify-between text-sm bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-bold text-slate-200">
                  {effectiveWinner?.name || winnerTeam?.name || match.teamA.name}
                </span>
                <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-semibold">
                  Fica em campo
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">VS</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200">
                  {nextChallenger?.name || (loserTeam?.id === match.teamA.id ? match.teamA.name : match.teamB.name)}
                </span>
                <span className="text-[11px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md font-semibold">
                  Desafiante
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              O perdedor vai para o final da fila de espera e o cronômetro oficial é reiniciado automaticamente para a próxima partida.
            </p>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="space-y-3">
          <button
            onClick={() => {
              onStartNextMatch(effectiveWinnerId || undefined);
              onClose();
            }}
            disabled={isDraw && !selectedDrawAdvancingId}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black py-4 px-6 rounded-2xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-base"
          >
            <span>Iniciar Próxima Partida</span>
            <ArrowRight size={20} />
          </button>

          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-4 rounded-xl transition text-sm"
          >
            Apenas Fechar e Ver Tabela
          </button>
        </div>
      </div>
    </div>
  );
}
