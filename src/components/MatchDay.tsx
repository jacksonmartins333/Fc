import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Check, Users, Shuffle, Shield } from 'lucide-react';
import { Team } from '../types';
import { useAuth } from '../store/AuthContext';
import { RulesModal } from './RulesModal';

interface MatchDayProps {
  setCurrentTab?: (tab: string) => void;
}

export function MatchDay({ setCurrentTab }: MatchDayProps) {
  const { isAdmin, players, togglePresence, maxPlayersPerTeam, numberOfTeams, setMaxPlayersPerTeam, setNumberOfTeams, generateTeams, startMatch } = useAppContext();
  const { user, login } = useAuth();
  
  const [generatedTeams, setGeneratedTeams] = useState<Team[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const presentPlayers = players.filter(p => p.isPresent);
  const totalSlots = maxPlayersPerTeam * numberOfTeams;
  const isFull = presentPlayers.length >= totalSlots;

  const handleGenerateTeams = (balanced: boolean) => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedTeams(generateTeams(balanced));
      setIsGenerating(false);
    }, 500);
  };

  const handleStartMatch = (tA: Team, tB: Team) => {
    startMatch(tA, tB);
    if (setCurrentTab) {
      setCurrentTab('gamecenter');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">Lista de Chamada</h2>
          <RulesModal />
        </div>
        
        {isAdmin && (
          <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-sm">
            <div className="flex items-center gap-2">
              <label className="text-slate-600 font-medium">Jogadores p/ time:</label>
              <input type="number" min="3" max="11" value={maxPlayersPerTeam} onChange={(e) => setMaxPlayersPerTeam(Number(e.target.value))} className="w-16 border border-slate-300 rounded px-2 py-1" />
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <label className="text-slate-600 font-medium">Qtd. Times:</label>
              <input type="number" min="2" max="6" value={numberOfTeams} onChange={(e) => setNumberOfTeams(Number(e.target.value))} className="w-16 border border-slate-300 rounded px-2 py-1" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-3xl font-bold text-slate-800">{presentPlayers.length}</span>
          <span className="text-slate-500 font-medium ml-1">/ {totalSlots} Confirmados</span>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isFull ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {isFull ? 'Lista Fechada' : 'Vagas Abertas'}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Mensalistas</h3>
            <span className="text-xs font-medium text-slate-500">Prioridade</span>
          </div>
          <div className="divide-y divide-slate-100">
            {players.filter(p => p.type === 'mensalista').map(player => (
              <button
                key={player.id}
                onClick={() => isAdmin && togglePresence(player.id)}
                disabled={!isAdmin ? false : (!player.isPresent && isFull)}
                className={`w-full p-4 flex items-center justify-between transition-colors ${player.isPresent ? (isAdmin ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'bg-emerald-50/50') : (isAdmin ? 'hover:bg-slate-50' : '')} disabled:opacity-50 disabled:cursor-not-allowed ${!isAdmin ? 'cursor-default' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${player.isPresent ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent'}`}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className={`font-medium ${player.isPresent ? 'text-emerald-900' : 'text-slate-700'}`}>{player.name}</span>
                  {player.isGoalkeeper && <Shield size={14} className="text-slate-400" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Avulsos (Convidados)</h3>
            <span className="text-xs font-medium text-slate-500">Sujeito a vaga</span>
          </div>
          <div className="divide-y divide-slate-100">
            {players.filter(p => p.type === 'avulso').map(player => (
              <button
                key={player.id}
                onClick={() => isAdmin && togglePresence(player.id)}
                disabled={!isAdmin ? false : (!player.isPresent && isFull)}
                className={`w-full p-4 flex items-center justify-between transition-colors ${player.isPresent ? (isAdmin ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'bg-emerald-50/50') : (isAdmin ? 'hover:bg-slate-50' : '')} disabled:opacity-50 disabled:cursor-not-allowed ${!isAdmin ? 'cursor-default' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${player.isPresent ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent'}`}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className={`font-medium ${player.isPresent ? 'text-emerald-900' : 'text-slate-700'}`}>{player.name}</span>
                  {player.isGoalkeeper && <Shield size={14} className="text-slate-400" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {isAdmin && presentPlayers.length > 0 && (
        <div className="bg-slate-800 rounded-xl shadow-sm p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-4">Sorteio de Times</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Com base nos jogadores confirmados, o sistema criará os times. Você pode escolher equilibrar os times pelo nível (estrelas) ou fazer um sorteio 100% aleatório.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => handleGenerateTeams(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Users size={20} /> Equilibrado (Por Nível)
            </button>
            <button
              onClick={() => handleGenerateTeams(false)}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Shuffle size={20} /> Aleatório (Sorte na Sorte)
            </button>
          </div>
        </div>
      )}

      {isAdmin && isGenerating && (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      )}

      {isAdmin && generatedTeams.length > 0 && !isGenerating && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-2xl font-bold text-slate-800 mt-8 border-t pt-8">Times Formados</h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedTeams.map((team, idx) => (
              <div key={team.id} className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-100 p-3 text-center font-bold text-slate-800 border-b border-slate-200">
                  {team.name}
                </div>
                <div className="p-2">
                  <ul className="divide-y divide-slate-100">
                    {team.players.map(p => (
                      <li key={p.id} className="p-2 flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-700 flex items-center gap-1">
                          {p.isGoalkeeper && <Shield size={12} className="text-slate-400" />}
                          {p.name}
                        </span>
                        <div className="flex gap-0.5 text-slate-300">
                          {Array.from({length: p.rating}).map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400" />)}
                        </div>
                      </li>
                    ))}
                    {team.players.length === 0 && (
                      <li className="p-4 text-center text-slate-400 text-sm">Nenhum jogador</li>
                    )}
                  </ul>
                </div>
                {/* To start a match, you'd usually pick 2 teams. Let's make a UI for that below */}
              </div>
            ))}
          </div>

          {generatedTeams.length >= 2 && (
            <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
              <h4 className="font-bold text-emerald-900 mb-4">Iniciar Partida</h4>
              <div className="flex flex-wrap items-center gap-4">
                <select id="teamASelect" className="bg-white border border-emerald-200 rounded-lg p-2 text-emerald-900 font-medium focus:ring-2 focus:ring-emerald-500">
                  {generatedTeams.map(t => <option key={`a_${t.id}`} value={t.id}>{t.name}</option>)}
                </select>
                <span className="font-bold text-emerald-600">VS</span>
                <select id="teamBSelect" defaultValue={generatedTeams[1]?.id} className="bg-white border border-emerald-200 rounded-lg p-2 text-emerald-900 font-medium focus:ring-2 focus:ring-emerald-500">
                  {generatedTeams.map(t => <option key={`b_${t.id}`} value={t.id}>{t.name}</option>)}
                </select>
                <button 
                  onClick={() => {
                    const selA = (document.getElementById('teamASelect') as HTMLSelectElement).value;
                    const selB = (document.getElementById('teamBSelect') as HTMLSelectElement).value;
                    if(selA === selB) {
                      alert('Selecione times diferentes!');
                      return;
                    }
                    const tA = generatedTeams.find(t => t.id === selA);
                    const tB = generatedTeams.find(t => t.id === selB);
                    if(tA && tB) handleStartMatch(tA, tB);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition ml-auto"
                >
                  Apito Inicial
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
