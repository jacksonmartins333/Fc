import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Trophy, Shield, Target, Award, PlayCircle, Users } from 'lucide-react';
import { Match, Team, Player } from '../types';
import { MatchTimer } from './MatchTimer';

export function Gamecenter() {
  const { matches, updateMatchScore, finishMatch, players, isAdmin } = useAppContext();
  
  const activeMatches = matches.filter(m => m.status === 'in_progress');
  const pastMatches = matches.filter(m => m.status === 'finished');

  const [selectedPlayerForEvent, setSelectedPlayerForEvent] = useState<{matchId: string, teamId: string, type: 'goal' | 'assist'} | null>(null);

  // Compute rankings
  const rankings = {
    artilheiro: [...players].sort((a, b) => b.stats.goals - a.stats.goals).slice(0, 3),
    assistencias: [...players].sort((a, b) => b.stats.assists - a.stats.assists).slice(0, 3),
    goleiro: [...players].filter(p => p.isGoalkeeper).sort((a, b) => {
      // sort by least goals conceded per match played
      const aAvg = a.stats.matchesPlayed > 0 ? a.stats.goalsConceded / a.stats.matchesPlayed : 999;
      const bAvg = b.stats.matchesPlayed > 0 ? b.stats.goalsConceded / b.stats.matchesPlayed : 999;
      if (aAvg === bAvg) return b.stats.matchesPlayed - a.stats.matchesPlayed; // tie breaker: more matches
      return aAvg - bAvg;
    }).slice(0, 3),
    rei: [...players].sort((a, b) => b.stats.matchesWon - a.stats.matchesWon).slice(0, 3),
  };

  const handleEventSelect = (matchId: string, teamId: string, type: 'goal' | 'assist') => {
    setSelectedPlayerForEvent({ matchId, teamId, type });
  };

  const confirmEvent = (playerId: string) => {
    if (selectedPlayerForEvent) {
      updateMatchScore(selectedPlayerForEvent.matchId, selectedPlayerForEvent.teamId, selectedPlayerForEvent.type, playerId);
      setSelectedPlayerForEvent(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-slate-800 text-white rounded-xl shadow-lg">
          <PlayCircle size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Partidas Ao Vivo</h2>
          <p className="text-slate-500 text-sm">Cronômetro oficial de 10 min, placar e estatísticas em tempo real</p>
        </div>
      </div>

      {activeMatches.length === 0 ? (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center shadow-sm">
            <p className="text-slate-600 font-bold text-base">Nenhuma partida registrada em andamento no momento.</p>
            <p className="text-sm text-slate-500 mt-1">Você pode usar o cronômetro oficial de 10 minutos abaixo ou ir até a aba "Lista" para sortear os times!</p>
          </div>

          <MatchTimer matchTitle="Tempo de Jogo (10 minutos)" />
        </div>
      ) : (
        <div className="space-y-6">
          {activeMatches.map(match => (
            <div key={match.id} className="space-y-6">
              <MatchTimer 
                matchTitle={`${match.teamA.name} x ${match.teamB.name}`}
                onFinishMatch={() => {
                  if (window.confirm('Encerrar esta partida? Os dados irão para o ranking da Champions da Grota.')) {
                    finishMatch(match.id);
                  }
                }}
              />

              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-slate-800 text-white p-3 text-center text-xs font-bold uppercase tracking-widest relative">
                <span className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  Ao Vivo
                </span>
              </div>
              
              <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                {/* Team A */}
                <div className="flex-1 flex flex-col items-center">
                  <h3 className="text-2xl font-black text-slate-800 mb-4">{match.teamA.name}</h3>
                  <div className="text-7xl font-black text-slate-900 font-mono tracking-tighter bg-slate-50 px-6 py-2 rounded-xl shadow-inner border border-slate-100">
                    {match.teamA.score}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 mt-6">
                      <button onClick={() => handleEventSelect(match.id, match.teamA.id, 'goal')} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-4 py-2 rounded-lg text-sm transition">
                        + Gol
                      </button>
                      <button onClick={() => handleEventSelect(match.id, match.teamA.id, 'assist')} className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold px-4 py-2 rounded-lg text-sm transition">
                        + Assist.
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-3xl font-black text-slate-300">X</div>

                {/* Team B */}
                <div className="flex-1 flex flex-col items-center">
                  <h3 className="text-2xl font-black text-slate-800 mb-4">{match.teamB.name}</h3>
                  <div className="text-7xl font-black text-slate-900 font-mono tracking-tighter bg-slate-50 px-6 py-2 rounded-xl shadow-inner border border-slate-100">
                    {match.teamB.score}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 mt-6">
                      <button onClick={() => handleEventSelect(match.id, match.teamB.id, 'goal')} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-4 py-2 rounded-lg text-sm transition">
                        + Gol
                      </button>
                      <button onClick={() => handleEventSelect(match.id, match.teamB.id, 'assist')} className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold px-4 py-2 rounded-lg text-sm transition">
                        + Assist.
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-center">
                  <button onClick={() => {
                    if(window.confirm('Encerrar esta partida? Os dados irão para o ranking.')) {
                      finishMatch(match.id);
                    }
                  }} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-xl transition w-full md:w-auto">
                    Encerrar Partida
                  </button>
                </div>
              )}

              {/* Event Player Selector Modal */}
              {selectedPlayerForEvent && selectedPlayerForEvent.matchId === match.id && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col p-6 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xl font-bold text-slate-800">
                      Quem fez {selectedPlayerForEvent.type === 'goal' ? 'o gol' : 'a assistência'}?
                    </h4>
                    <button onClick={() => setSelectedPlayerForEvent(null)} className="text-slate-400 hover:text-slate-600 font-bold p-2">FECHAR</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto">
                    {(selectedPlayerForEvent.teamId === match.teamA.id ? match.teamA : match.teamB).players.map(p => (
                      <button
                        key={p.id}
                        onClick={() => confirmEvent(p.id)}
                        className="bg-white border-2 border-slate-200 p-4 rounded-xl font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition text-left flex justify-between items-center"
                      >
                        {p.name}
                        {p.isGoalkeeper && <Shield size={16} className="text-slate-300" />}
                      </button>
                    ))}
                    <button
                      onClick={() => confirmEvent('contra_ou_desconhecido')}
                      className="bg-slate-100 border-2 border-slate-200 p-4 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition text-left"
                    >
                      Não registrar autor
                    </button>
                  </div>
                </div>
              )}
            </div>
            </div>
          ))}
        </div>
      )}


      <div className="pt-8 border-t border-slate-200">
        <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3">
          <Trophy className="text-amber-400" size={32} />
          A Champions da Grota
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Artilheiro */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
            <Target className="absolute -right-4 -bottom-4 text-white/20 w-32 h-32" />
            <h3 className="font-bold text-orange-100 mb-4 uppercase tracking-wider text-xs">Artilheiro do Mês</h3>
            {rankings.artilheiro.map((p, i) => (
              <div key={p.id} className={`flex justify-between items-center ${i===0 ? 'mb-4 border-b border-white/20 pb-4' : 'text-sm opacity-90 mb-2'}`}>
                <span className="font-bold truncate pr-4">{i+1}. {p.name}</span>
                <span className="font-black font-mono text-xl">{p.stats.goals} <span className="text-xs font-normal opacity-75">gols</span></span>
              </div>
            ))}
          </div>

          {/* Assistências */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
             <Users className="absolute -right-4 -bottom-4 text-white/20 w-32 h-32" />
            <h3 className="font-bold text-blue-100 mb-4 uppercase tracking-wider text-xs">Garçom (Assistências)</h3>
            {rankings.assistencias.map((p, i) => (
              <div key={p.id} className={`flex justify-between items-center ${i===0 ? 'mb-4 border-b border-white/20 pb-4' : 'text-sm opacity-90 mb-2'}`}>
                <span className="font-bold truncate pr-4">{i+1}. {p.name}</span>
                <span className="font-black font-mono text-xl">{p.stats.assists} <span className="text-xs font-normal opacity-75">ast</span></span>
              </div>
            ))}
          </div>

          {/* Goleiro */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
             <Shield className="absolute -right-4 -bottom-4 text-white/20 w-32 h-32" />
            <h3 className="font-bold text-emerald-100 mb-4 uppercase tracking-wider text-xs">Muralha (Goleiros)</h3>
            {rankings.goleiro.map((p, i) => (
              <div key={p.id} className={`flex justify-between items-center ${i===0 ? 'mb-4 border-b border-white/20 pb-4' : 'text-sm opacity-90 mb-2'}`}>
                <span className="font-bold truncate pr-4">{i+1}. {p.name}</span>
                <div className="text-right">
                   <div className="font-black font-mono text-lg">{p.stats.goalsConceded} <span className="text-[10px] font-normal opacity-75">gols sofridos</span></div>
                   <div className="text-[10px] opacity-75">{p.stats.matchesPlayed} jogos</div>
                </div>
              </div>
            ))}
          </div>

          {/* Rei */}
          <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl p-6 text-white shadow-xl shadow-purple-500/20 relative overflow-hidden">
             <Award className="absolute -right-4 -bottom-4 text-white/20 w-32 h-32" />
            <h3 className="font-bold text-purple-100 mb-4 uppercase tracking-wider text-xs">Rei do Sintético (Vitórias)</h3>
            {rankings.rei.map((p, i) => (
              <div key={p.id} className={`flex justify-between items-center ${i===0 ? 'mb-4 border-b border-white/20 pb-4' : 'text-sm opacity-90 mb-2'}`}>
                <span className="font-bold truncate pr-4">{i+1}. {p.name}</span>
                <span className="font-black font-mono text-xl">{p.stats.matchesWon} <span className="text-xs font-normal opacity-75">vit.</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
