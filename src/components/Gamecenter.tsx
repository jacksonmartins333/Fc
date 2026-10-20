import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { 
  Trophy, Shield, Target, Award, PlayCircle, Users, ArrowRight, 
  RotateCcw, HeartCrack, AlertCircle, CheckCircle2, UserCheck, 
  UserMinus, Scale, Clock, Sparkles, ChevronRight, Swords, Flame, Plus
} from 'lucide-react';
import { Match, Team, Player } from '../types';
import { MatchTimer } from './MatchTimer';
import { TiredPlayerModal } from './TiredPlayerModal';
import { MatchFinishModal } from './MatchFinishModal';

export function Gamecenter() {
  const { 
    matches, 
    updateMatchScore, 
    finishMatch, 
    advanceToNextMatch,
    markPlayerTiredOrInjured,
    returnPlayerToGame,
    autoBalanceTeams,
    players, 
    isAdmin,
    currentTeams,
    teamQueue,
    benchPlayers,
    startMatch
  } = useAppContext();
  
  const activeMatches = matches.filter(m => m.status === 'in_progress');
  const pastMatches = matches.filter(m => m.status === 'finished');
  const activeMatch = activeMatches[0] || null;

  // Modals state
  const [selectedPlayerForEvent, setSelectedPlayerForEvent] = useState<{matchId: string, teamId: string, type: 'goal' | 'assist'} | null>(null);
  const [tiredModalData, setTiredModalData] = useState<{ player: Player; team: Team } | null>(null);
  const [finishModalData, setFinishModalData] = useState<{
    match: Match;
    winnerTeam: Team | null;
    loserTeam: Team | null;
    isDraw: boolean;
    nextChallenger: Team | null;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Compute rankings
  const rankings = {
    artilheiro: [...players].sort((a, b) => b.stats.goals - a.stats.goals).slice(0, 3),
    assistencias: [...players].sort((a, b) => b.stats.assists - a.stats.assists).slice(0, 3),
    goleiro: [...players].filter(p => p.isGoalkeeper).sort((a, b) => {
      const aAvg = a.stats.matchesPlayed > 0 ? a.stats.goalsConceded / a.stats.matchesPlayed : 999;
      const bAvg = b.stats.matchesPlayed > 0 ? b.stats.goalsConceded / b.stats.matchesPlayed : 999;
      if (aAvg === bAvg) return b.stats.matchesPlayed - a.stats.matchesPlayed;
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

  const handleFinishCurrentMatch = (match: Match) => {
    const res = finishMatch(match.id);
    
    // Find next challenger from queue or remaining teams
    let challengerTeam: Team | null = null;
    if (teamQueue.length > 0) {
      challengerTeam = currentTeams.find(t => t.id === teamQueue[0]) || null;
    } else {
      // If only 2 teams, challenger is the other team
      const otherTeamId = res.winnerTeam?.id === match.teamA.id ? match.teamB.id : match.teamA.id;
      challengerTeam = currentTeams.find(t => t.id === otherTeamId) || null;
    }

    setFinishModalData({
      match,
      winnerTeam: res.winnerTeam,
      loserTeam: res.loserTeam,
      isDraw: res.isDraw,
      nextChallenger: challengerTeam,
    });
  };

  const handleStartNextMatch = (advancingTeamId?: string) => {
    const res = advanceToNextMatch(advancingTeamId);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleConfirmTiredOrInjured = (playerId: string, teamId: string, reason: 'tired' | 'injured' | 'left') => {
    const res = markPlayerTiredOrInjured(playerId, teamId, reason);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleReturnPlayer = (playerId: string, targetTeamId?: string) => {
    const res = returnPlayerToGame(playerId, targetTeamId);
    if (res.success) {
      showToast(res.message, 'success');
    }
  };

  const handleAutoBalance = () => {
    const res = autoBalanceTeams();
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  // Find next challenger team name
  const nextInQueueId = teamQueue[0];
  const nextInQueueTeam = currentTeams.find(t => t.id === nextInQueueId);

  // Injured or tired players in general
  const tiredPlayers = players.filter(p => p.isInjuredOrTired);

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl border flex items-center gap-3 max-w-md animate-in slide-in-from-top duration-300 ${
            toastMessage.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : toastMessage.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle size={22} className="text-red-500 shrink-0" />
          ) : (
            <CheckCircle2 size={22} className="text-emerald-500 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toastMessage.text}</span>
          <button 
            onClick={() => setToastMessage(null)} 
            className="ml-auto text-slate-400 hover:text-slate-600 font-bold p-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-800 text-white rounded-xl shadow-lg">
            <PlayCircle size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Partidas Ao Vivo & Rei da Quadra</h2>
            <p className="text-slate-500 text-sm">Vencedor permanece em campo, desafiantes em rodízio e ajuste automático de time</p>
          </div>
        </div>

        {/* Global Auto Balance Button */}
        {currentTeams.length >= 2 && (
          <button
            onClick={handleAutoBalance}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition"
            title="Reorganiza os jogadores ativos equilibrando o número de pessoas por time"
          >
            <Scale size={16} className="text-emerald-600" />
            <span>Reequilibrar Times Automaticamente</span>
          </button>
        )}
      </div>

      {/* Partida Ativa ou Aviso */}
      {!activeMatch ? (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center shadow-xs">
            <h3 className="text-slate-800 font-bold text-lg mb-1">Nenhuma Partida em Andamento</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
              {currentTeams.length >= 2 
                ? 'Os times já estão formados! Você pode iniciar a próxima partida abaixo ou pela aba Lista.'
                : 'Vá até a aba "Lista" para confirmar as presenças e sortear os times da pelada.'}
            </p>

            {currentTeams.length >= 2 && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => startMatch(currentTeams[0], currentTeams[1])}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md flex items-center gap-2 text-sm"
                >
                  <Swords size={18} />
                  <span>Iniciar: {currentTeams[0].name} x {currentTeams[1].name}</span>
                </button>
              </div>
            )}
          </div>

          <MatchTimer matchTitle="Tempo de Jogo (10 minutos)" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cronômetro Oficial */}
          <MatchTimer 
            matchTitle={`Partida #${activeMatch.matchNumber || 1}: ${activeMatch.teamA.name} x ${activeMatch.teamB.name}`}
            onFinishMatch={() => handleFinishCurrentMatch(activeMatch)}
          />

          {/* Card da Partida Ao Vivo */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-3.5 px-6 flex justify-between items-center text-xs font-bold uppercase tracking-widest">
              <span className="flex items-center gap-2 text-emerald-400">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                Partida #{activeMatch.matchNumber || 1} • Em Andamento
              </span>
              <span className="text-slate-400 normal-case font-medium">
                Regra: Vencedor Fica
              </span>
            </div>
            
            <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              {/* Team A */}
              <div className="flex-1 flex flex-col items-center text-center">
                <h3 className="text-2xl font-black text-slate-800 mb-1">{activeMatch.teamA.name}</h3>
                <span className="text-xs text-slate-400 font-semibold mb-3">
                  {activeMatch.teamA.players.length} jogadores em campo
                </span>
                
                <div className="text-7xl font-black text-slate-900 font-mono tracking-tighter bg-slate-50 px-6 py-2 rounded-2xl shadow-inner border border-slate-100">
                  {activeMatch.teamA.score}
                </div>

                <div className="flex gap-2 mt-5">
                  <button 
                    onClick={() => handleEventSelect(activeMatch.id, activeMatch.teamA.id, 'goal')} 
                    className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-4 py-2 rounded-xl text-sm transition flex items-center gap-1 shadow-2xs"
                  >
                    + Gol
                  </button>
                  <button 
                    onClick={() => handleEventSelect(activeMatch.id, activeMatch.teamA.id, 'assist')} 
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold px-4 py-2 rounded-xl text-sm transition flex items-center gap-1 shadow-2xs"
                  >
                    + Assist.
                  </button>
                </div>
              </div>

              <div className="text-3xl font-black text-slate-300">VS</div>

              {/* Team B */}
              <div className="flex-1 flex flex-col items-center text-center">
                <h3 className="text-2xl font-black text-slate-800 mb-1">{activeMatch.teamB.name}</h3>
                <span className="text-xs text-slate-400 font-semibold mb-3">
                  {activeMatch.teamB.players.length} jogadores em campo
                </span>

                <div className="text-7xl font-black text-slate-900 font-mono tracking-tighter bg-slate-50 px-6 py-2 rounded-2xl shadow-inner border border-slate-100">
                  {activeMatch.teamB.score}
                </div>

                <div className="flex gap-2 mt-5">
                  <button 
                    onClick={() => handleEventSelect(activeMatch.id, activeMatch.teamB.id, 'goal')} 
                    className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-4 py-2 rounded-xl text-sm transition flex items-center gap-1 shadow-2xs"
                  >
                    + Gol
                  </button>
                  <button 
                    onClick={() => handleEventSelect(activeMatch.id, activeMatch.teamB.id, 'assist')} 
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold px-4 py-2 rounded-xl text-sm transition flex items-center gap-1 shadow-2xs"
                  >
                    + Assist.
                  </button>
                </div>
              </div>
            </div>

            {/* Escalação e Ações de Ajuste / Cansou / Machucou em Campo */}
            <div className="bg-slate-50 p-4 md:p-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Users size={16} className="text-slate-500" />
                  Jogadores em Campo & Substituições
                </h4>
                <span className="text-xs text-slate-400">
                  Toque em "Cansou" se alguém parar para o time se ajustar
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Team A Roster */}
                <div className="bg-white rounded-xl p-3 border border-slate-200">
                  <div className="font-bold text-sm text-slate-800 mb-2 pb-1 border-b border-slate-100 flex justify-between">
                    <span>{activeMatch.teamA.name} ({activeMatch.teamA.players.length})</span>
                  </div>
                  <ul className="space-y-1.5">
                    {activeMatch.teamA.players.map(p => (
                      <li key={`teamA_${p.id}`} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg text-sm">
                        <span className="font-medium text-slate-700 flex items-center gap-1.5">
                          {p.isGoalkeeper && (
                            <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">GOL</span>
                          )}
                          {p.name}
                        </span>
                        <button
                          onClick={() => setTiredModalData({ player: p, team: activeMatch.teamA })}
                          className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition"
                          title="Jogador cansou ou se machucou: sairá do time e se ajustará automaticamente"
                        >
                          <HeartCrack size={12} className="text-amber-600" />
                          <span>Cansou / Saiu</span>
                        </button>
                      </li>
                    ))}
                    {activeMatch.teamA.players.length === 0 && (
                      <li className="text-xs text-slate-400 py-2 text-center">Nenhum jogador escalado</li>
                    )}
                  </ul>
                </div>

                {/* Team B Roster */}
                <div className="bg-white rounded-xl p-3 border border-slate-200">
                  <div className="font-bold text-sm text-slate-800 mb-2 pb-1 border-b border-slate-100 flex justify-between">
                    <span>{activeMatch.teamB.name} ({activeMatch.teamB.players.length})</span>
                  </div>
                  <ul className="space-y-1.5">
                    {activeMatch.teamB.players.map(p => (
                      <li key={`teamB_${p.id}`} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg text-sm">
                        <span className="font-medium text-slate-700 flex items-center gap-1.5">
                          {p.isGoalkeeper && (
                            <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">GOL</span>
                          )}
                          {p.name}
                        </span>
                        <button
                          onClick={() => setTiredModalData({ player: p, team: activeMatch.teamB })}
                          className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition"
                          title="Jogador cansou ou se machucou: sairá do time e se ajustará automaticamente"
                        >
                          <HeartCrack size={12} className="text-amber-600" />
                          <span>Cansou / Saiu</span>
                        </button>
                      </li>
                    ))}
                    {activeMatch.teamB.players.length === 0 && (
                      <li className="text-xs text-slate-400 py-2 text-center">Nenhum jogador escalado</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer with Finish Match Button */}
            <div className="bg-slate-100 p-4 px-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <Flame size={16} className="text-amber-500" />
                <span>
                  {nextInQueueTeam 
                    ? `Próximo na fila: ${nextInQueueTeam.name} enfrenta o vencedor!` 
                    : 'Próxima partida continuará com o vencedor!'}
                </span>
              </div>

              <button 
                onClick={() => handleFinishCurrentMatch(activeMatch)} 
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl transition w-full sm:w-auto shadow-md text-sm flex items-center justify-center gap-2"
              >
                <Trophy size={16} className="text-amber-400" />
                <span>Encerrar Partida e Avançar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seção da Fila de Espera dos Times & Próxima Partida */}
      {currentTeams.length > 2 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <Swords size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Fila de Espera dos Times (Rodízio)</h3>
                <p className="text-xs text-slate-400">Ordem de quem entra na quadra para desafiar o vencedor</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {teamQueue.map((teamId, index) => {
              const team = currentTeams.find(t => t.id === teamId);
              if (!team) return null;
              return (
                <div 
                  key={teamId}
                  className={`p-3 rounded-xl border flex items-center gap-3 ${
                    index === 0 
                      ? 'bg-blue-50/70 border-blue-200 text-blue-950 font-bold' 
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}>
                    {index + 1}º
                  </span>
                  <div>
                    <span className="text-sm font-bold block">{team.name}</span>
                    <span className="text-[11px] text-slate-500 font-medium">{team.players.length} jogadores</span>
                  </div>
                  {index === 0 && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-extrabold">
                      Próximo Desafiante
                    </span>
                  )}
                </div>
              );
            })}
            {teamQueue.length === 0 && (
              <span className="text-xs text-slate-400">Nenhum time na fila de espera no momento.</span>
            )}
          </div>
        </div>
      )}

      {/* Banco de Reservas e Jogadores em Recuperação (Cansados/Lesionados) */}
      {(benchPlayers.length > 0 || tiredPlayers.length > 0) && (
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Banco de Reservas & Descanso</h3>
              <p className="text-xs text-slate-400">Jogadores disponíveis para substituição automática ou recuperando o fôlego</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Banco de Reservas disponíveis */}
            {benchPlayers.map(p => (
              <div key={`bench_${p.id}`} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="font-bold text-slate-800 text-sm block">
                    {p.name} {p.isGoalkeeper && <span className="text-[10px] text-amber-700 bg-amber-100 px-1 py-0.5 rounded font-bold">GOL</span>}
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold">Reserva disponível</span>
                </div>
                <div className="flex gap-0.5 text-slate-300">
                  {Array.from({length: p.rating}).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  ))}
                </div>
              </div>
            ))}

            {/* Jogadores Cansados / Lesionados */}
            {tiredPlayers.map(p => (
              <div key={`tired_${p.id}`} className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="font-bold text-slate-800 text-sm block">{p.name}</span>
                  <span className="text-xs text-amber-700 font-semibold">
                    {p.injuryReason === 'injured' ? 'Machucou' : 'Cansou / Descanso'}
                  </span>
                </div>
                <button
                  onClick={() => handleReturnPlayer(p.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 shadow-2xs"
                  title="Voltar ao jogo / recuperado"
                >
                  <UserCheck size={13} />
                  <span>Voltar</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico de Partidas Realizadas Hoje */}
      {pastMatches.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
              <Trophy size={20} className="text-amber-500" />
              Histórico de Partidas da Rodada ({pastMatches.length})
            </h3>
            {!activeMatch && (
              <button
                onClick={() => handleStartNextMatch()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 shadow-xs"
              >
                <span>Próxima Partida (Vencedor Fica)</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {pastMatches.map((m, index) => {
              const teamAWon = m.teamA.score > m.teamB.score;
              const teamBWon = m.teamB.score > m.teamA.score;
              return (
                <div key={m.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-16">
                      Jogo #{m.matchNumber || index + 1}
                    </span>
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span className={teamAWon ? 'text-emerald-700' : ''}>{m.teamA.name}</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-black text-slate-900">
                        {m.teamA.score} x {m.teamB.score}
                      </span>
                      <span className={teamBWon ? 'text-emerald-700' : ''}>{m.teamB.name}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">
                    {teamAWon 
                      ? `🏆 ${m.teamA.name} Venceu` 
                      : teamBWon 
                      ? `🏆 ${m.teamB.name} Venceu` 
                      : '🤝 Empate'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Selector de Autor do Gol/Assistência */}
      {selectedPlayerForEvent && activeMatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-slate-800">
                Quem fez {selectedPlayerForEvent.type === 'goal' ? 'o gol' : 'a assistência'}?
              </h4>
              <button 
                onClick={() => setSelectedPlayerForEvent(null)} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-72 overflow-y-auto mb-4">
              {(selectedPlayerForEvent.teamId === activeMatch.teamA.id ? activeMatch.teamA : activeMatch.teamB).players.map(p => (
                <button
                  key={p.id}
                  onClick={() => confirmEvent(p.id)}
                  className="bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 transition text-left flex justify-between items-center text-sm"
                >
                  <span>{p.name}</span>
                  {p.isGoalkeeper && <Shield size={14} className="text-amber-500" />}
                </button>
              ))}
              <button
                onClick={() => confirmEvent('contra_ou_desconhecido')}
                className="bg-slate-100 border border-slate-200 p-3 rounded-xl font-semibold text-slate-500 hover:bg-slate-200 transition text-left text-sm"
              >
                Não registrar autor
              </button>
            </div>

            <button
              onClick={() => setSelectedPlayerForEvent(null)}
              className="w-full py-2 text-slate-500 font-semibold text-xs hover:text-slate-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Jogador que Cansou / Machucou */}
      <TiredPlayerModal
        isOpen={Boolean(tiredModalData)}
        player={tiredModalData?.player || null}
        team={tiredModalData?.team || null}
        onClose={() => setTiredModalData(null)}
        onConfirm={handleConfirmTiredOrInjured}
      />

      {/* Modal de Encerramento e Próxima Partida */}
      <MatchFinishModal
        isOpen={Boolean(finishModalData)}
        match={finishModalData?.match || null}
        winnerTeam={finishModalData?.winnerTeam || null}
        loserTeam={finishModalData?.loserTeam || null}
        isDraw={finishModalData?.isDraw || false}
        nextChallenger={finishModalData?.nextChallenger || null}
        onClose={() => setFinishModalData(null)}
        onStartNextMatch={handleStartNextMatch}
      />

      {/* Champions da Grota Rankings */}
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
