import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { 
  Check, Users, Shuffle, Shield, UserMinus, UserPlus, 
  Trash2, RotateCcw, Plus, Lock, Unlock, AlertCircle, CheckCircle2,
  HeartCrack, Scale, ArrowRight
} from 'lucide-react';
import { Team, Player } from '../types';
import { RulesModal } from './RulesModal';
import { AdminPinModal } from './AdminPinModal';
import { ConfirmDeletePlayerModal } from './ConfirmDeletePlayerModal';
import { TiredPlayerModal } from './TiredPlayerModal';

interface MatchDayProps {
  setCurrentTab?: (tab: string) => void;
}

export function MatchDay({ setCurrentTab }: MatchDayProps) {
  const { 
    isAdmin, 
    players, 
    togglePresence, 
    setPlayerPresence,
    clearAllPresence,
    deletePlayer,
    addPlayer,
    maxPlayersPerTeam, 
    numberOfTeams, 
    setMaxPlayersPerTeam, 
    setNumberOfTeams, 
    generateTeams, 
    startMatch,
    currentTeams,
    autoBalanceTeams,
    markPlayerTiredOrInjured
  } = useAppContext();
  
  const [generatedTeams, setGeneratedTeams] = useState<Team[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [tiredModalData, setTiredModalData] = useState<{ player: Player; team: Team } | null>(null);

  // Modals state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingDeletePlayer, setPendingDeletePlayer] = useState<Player | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickType, setQuickType] = useState<'mensalista' | 'avulso'>('avulso');
  const [quickIsGk, setQuickIsGk] = useState(false);

  const presentPlayers = players.filter(p => p.isPresent);
  const absentPlayers = players.filter(p => !p.isPresent);
  const totalSlots = maxPlayersPerTeam * numberOfTeams;
  const isFull = presentPlayers.length >= totalSlots;

  const showToast = (text: string, type: 'error' | 'success' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  const handleToggle = (player: Player) => {
    const res = togglePresence(player.id);
    if (!res.success && res.message) {
      showToast(res.message, 'error');
    } else {
      if (player.isPresent) {
        showToast(`${player.name} foi removido(a) da lista de hoje.`);
      } else {
        showToast(`${player.name} confirmado(a) na lista!`);
      }
    }
  };

  const handleLeaveList = (player: Player, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const res = setPlayerPresence(player.id, false);
    if (!res.success && res.message) {
      showToast(res.message, 'error');
    } else {
      showToast(`${player.name} saiu da lista de hoje.`);
    }
  };

  const handleJoinList = (player: Player, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const res = setPlayerPresence(player.id, true);
    if (!res.success && res.message) {
      showToast(res.message, 'error');
    } else {
      showToast(`${player.name} entrou na lista!`);
    }
  };

  const handleDeleteClick = (player: Player, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) {
      // Need admin access first
      setShowPinModal(true);
      return;
    }
    setPendingDeletePlayer(player);
  };

  const handleConfirmDelete = (id: string) => {
    const target = players.find(p => p.id === id);
    deletePlayer(id);
    showToast(`${target?.name || 'Jogador'} foi excluído definitivamente do elenco.`);
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;

    addPlayer({
      name: quickName.trim(),
      type: quickType,
      rating: 3,
      paymentStatus: 'pendente',
      isGoalkeeper: quickIsGk,
    });

    showToast(`${quickName.trim()} adicionado ao elenco!`);
    setQuickName('');
    setQuickIsGk(false);
    setShowQuickAdd(false);
  };

  const handleGenerateTeams = (balanced: boolean) => {
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedTeams(generateTeams(balanced));
      setIsGenerating(false);
    }, 400);
  };

  const handleStartMatch = (tA: Team, tB: Team) => {
    startMatch(tA, tB);
    if (setCurrentTab) {
      setCurrentTab('gamecenter');
    }
  };

  const filterPlayers = (list: Player[]) => {
    if (activeFilter === 'present') return list.filter(p => p.isPresent);
    if (activeFilter === 'absent') return list.filter(p => !p.isPresent);
    return list;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusMessage && (
        <div 
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 max-w-md animate-in slide-in-from-top duration-300 ${
            statusMessage.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          {statusMessage.type === 'error' ? (
            <AlertCircle size={20} className="text-red-500 shrink-0" />
          ) : (
            <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
          )}
          <span className="text-sm font-semibold">{statusMessage.text}</span>
          <button 
            onClick={() => setStatusMessage(null)}
            className="ml-auto text-slate-400 hover:text-slate-600 p-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Lista da Pelada</h2>
            <RulesModal />
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            Confirme presença ou saia da lista para a partida de hoje.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {!isAdmin ? (
            <button
              onClick={() => setShowPinModal(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              title="Acesso com PIN do organizador (162222)"
            >
              <Lock size={14} className="text-slate-500" />
              <span>Modo Organizador</span>
            </button>
          ) : (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Unlock size={14} className="text-emerald-600" />
              <span>Organizador Ativo</span>
            </div>
          )}

          <button
            onClick={() => setShowQuickAdd(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            <Plus size={16} />
            <span>Adicionar Jogador</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition"
              title="Zerar todas as presenças para começar uma nova pelada"
            >
              <RotateCcw size={15} />
              <span className="hidden sm:inline">Zerar Presenças</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Match Parameters */}
      {isAdmin && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            Configuração da Partida:
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-slate-600 text-xs font-semibold">Jogadores / time:</label>
              <input 
                type="number" 
                min="3" 
                max="11" 
                value={maxPlayersPerTeam} 
                onChange={(e) => setMaxPlayersPerTeam(Number(e.target.value))} 
                className="w-16 border border-slate-300 rounded-lg px-2 py-1 text-center font-bold" 
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-600 text-xs font-semibold">Qtd. Times:</label>
              <input 
                type="number" 
                min="2" 
                max="6" 
                value={numberOfTeams} 
                onChange={(e) => setNumberOfTeams(Number(e.target.value))} 
                className="w-16 border border-slate-300 rounded-lg px-2 py-1 text-center font-bold" 
              />
            </div>
            <div className="text-xs text-slate-400">
              Total de vagas: <strong className="text-slate-700">{totalSlots}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Vagas Counter & Quick Filters */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800 tracking-tight">{presentPlayers.length}</span>
              <span className="text-slate-500 font-semibold text-sm">/ {totalSlots} Confirmados</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isFull 
                ? 'Lista completa! Novos jogadores entram na espera caso alguém saia.' 
                : `Restam ${totalSlots - presentPlayers.length} vaga(s) para fechar a pelada.`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
              isFull ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {isFull ? '● Lista Fechada' : '● Vagas Abertas'}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto text-xs sm:text-sm">
          <span className="text-slate-400 font-medium mr-1 hidden sm:inline">Exibir:</span>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeFilter === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({players.length})
          </button>
          <button
            onClick={() => setActiveFilter('present')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeFilter === 'present'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <Check size={14} /> Na Lista ({presentPlayers.length})
          </button>
          <button
            onClick={() => setActiveFilter('absent')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeFilter === 'absent'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Fora da Lista ({absentPlayers.length})
          </button>
        </div>
      </div>

      {/* Instrução clara de uso */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
        <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Como gerenciar quem joga:</strong>
          <span className="block mt-0.5 text-amber-800">
            • Para <strong>sair da lista de hoje</strong> (desistir da partida): basta clicar no botão vermelho <span className="font-semibold text-red-700 underline">"Sair da lista"</span> ao lado do nome.
            <br />
            • Para <strong>remover permanentemente</strong> quem não quer mais jogar no grupo: clique no ícone da lixeira <Trash2 size={13} className="inline text-slate-500" />.
          </span>
        </div>
      </div>

      {/* Grid: Mensalistas e Avulsos */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Mensalistas */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">Mensalistas</h3>
              <p className="text-xs text-slate-500">Prioridade na convocação</p>
            </div>
            <span className="text-xs bg-slate-200/80 text-slate-700 px-2.5 py-1 rounded-full font-bold">
              {players.filter(p => p.type === 'mensalista' && p.isPresent).length} / {players.filter(p => p.type === 'mensalista').length}
            </span>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {filterPlayers(players.filter(p => p.type === 'mensalista')).map(player => (
              <div
                key={player.id}
                className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors ${
                  player.isPresent ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50/80'
                }`}
              >
                {/* Info do Jogador */}
                <div 
                  className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
                  onClick={() => handleToggle(player)}
                  title="Clique para alternar presença"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    player.isPresent 
                      ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs' 
                      : 'border-slate-300 text-transparent hover:border-slate-400'
                  }`}>
                    <Check size={16} strokeWidth={3} />
                  </div>
                  
                  <div className="truncate">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                      <span className="truncate">{player.name}</span>
                      {player.isGoalkeeper && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold shrink-0">
                          <Shield size={11} /> GOL
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-medium flex items-center gap-1 mt-0.5">
                      {player.isPresent ? (
                        <span className="text-emerald-700 font-bold">✓ Confirmado na lista</span>
                      ) : (
                        <span className="text-slate-400">Ausente / Fora da lista</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações: Sair da Lista ou Confirmar + Excluir */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {player.isPresent ? (
                    <button
                      onClick={(e) => handleLeaveList(player, e)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      title="Remover este jogador da lista de hoje"
                    >
                      <UserMinus size={14} />
                      <span>Sair da lista</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleJoinList(player, e)}
                      disabled={isFull}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                      title={isFull ? 'Vagas esgotadas' : 'Confirmar presença deste jogador'}
                    >
                      <UserPlus size={14} />
                      <span>Entrar</span>
                    </button>
                  )}

                  {/* Excluir definitivamente */}
                  <button
                    onClick={(e) => handleDeleteClick(player, e)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition"
                    title="Excluir jogador do elenco definitivamente"
                    aria-label={`Excluir ${player.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {filterPlayers(players.filter(p => p.type === 'mensalista')).length === 0 && (
              <div className="p-6 text-center text-slate-400 text-sm">
                Nenhum mensalista encontrado no filtro.
              </div>
            )}
          </div>
        </div>

        {/* Avulsos (Convidados) */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">Avulsos (Convidados)</h3>
              <p className="text-xs text-slate-500">Sujeito a vaga disponível</p>
            </div>
            <span className="text-xs bg-slate-200/80 text-slate-700 px-2.5 py-1 rounded-full font-bold">
              {players.filter(p => p.type === 'avulso' && p.isPresent).length} / {players.filter(p => p.type === 'avulso').length}
            </span>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {filterPlayers(players.filter(p => p.type === 'avulso')).map(player => (
              <div
                key={player.id}
                className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors ${
                  player.isPresent ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50/80'
                }`}
              >
                {/* Info do Jogador */}
                <div 
                  className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
                  onClick={() => handleToggle(player)}
                  title="Clique para alternar presença"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    player.isPresent 
                      ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs' 
                      : 'border-slate-300 text-transparent hover:border-slate-400'
                  }`}>
                    <Check size={16} strokeWidth={3} />
                  </div>
                  
                  <div className="truncate">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                      <span className="truncate">{player.name}</span>
                      {player.isGoalkeeper && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold shrink-0">
                          <Shield size={11} /> GOL
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-medium flex items-center gap-1 mt-0.5">
                      {player.isPresent ? (
                        <span className="text-emerald-700 font-bold">✓ Confirmado na lista</span>
                      ) : (
                        <span className="text-slate-400">Ausente / Fora da lista</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações: Sair da Lista ou Confirmar + Excluir */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {player.isPresent ? (
                    <button
                      onClick={(e) => handleLeaveList(player, e)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      title="Remover este jogador da lista de hoje"
                    >
                      <UserMinus size={14} />
                      <span>Sair da lista</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleJoinList(player, e)}
                      disabled={isFull}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                      title={isFull ? 'Vagas esgotadas' : 'Confirmar presença deste jogador'}
                    >
                      <UserPlus size={14} />
                      <span>Entrar</span>
                    </button>
                  )}

                  {/* Excluir definitivamente */}
                  <button
                    onClick={(e) => handleDeleteClick(player, e)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition"
                    title="Excluir jogador do elenco definitivamente"
                    aria-label={`Excluir ${player.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {filterPlayers(players.filter(p => p.type === 'avulso')).length === 0 && (
              <div className="p-6 text-center text-slate-400 text-sm">
                Nenhum jogador avulso encontrado no filtro.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sorteio de Times (para Organizador ou geral quando houver jogadores) */}
      {presentPlayers.length > 0 && (
        <div className="bg-slate-800 rounded-2xl shadow-md p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2">Sorteio de Times</h3>
          <p className="text-slate-300 text-sm mb-6 max-w-lg mx-auto">
            Com base nos <strong>{presentPlayers.length} jogadores confirmados</strong> na lista, gere os times automaticamente.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => handleGenerateTeams(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-emerald-500/20"
            >
              <Users size={20} /> Equilibrado (Por Nível)
            </button>
            <button
              onClick={() => handleGenerateTeams(false)}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition"
            >
              <Shuffle size={20} /> Aleatório (Sorteio Livre)
            </button>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      )}

      {/* Times Formados */}
      {(currentTeams.length > 0 || generatedTeams.length > 0) && !isGenerating && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-8 border-t border-slate-200 pt-8">
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                Times Formados ({(currentTeams.length > 0 ? currentTeams : generatedTeams).length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Se alguém cansar ou machucar, toque em "Cansou" para o time se ajustar sozinho com a reserva ou rebalancear.
              </p>
            </div>

            <button
              onClick={() => {
                const res = autoBalanceTeams();
                if (res.success) {
                  showToast(res.message, 'success');
                } else {
                  showToast(res.message, 'error');
                }
              }}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition"
              title="Equilibrar número de jogadores e estrelas por time automaticamente"
            >
              <Scale size={16} className="text-emerald-600" />
              <span>Reequilibrar Times Sozinho</span>
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(currentTeams.length > 0 ? currentTeams : generatedTeams).map((team) => (
              <div key={team.id} className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 p-3 text-center font-bold text-slate-800 border-b border-slate-200 flex justify-between items-center px-4">
                  <span>{team.name}</span>
                  <span className="text-xs bg-white px-2 py-0.5 rounded-full text-slate-600 font-semibold">
                    {team.players.length} jogadores
                  </span>
                </div>
                <div className="p-2">
                  <ul className="divide-y divide-slate-100">
                    {team.players.map(p => (
                      <li key={p.id} className="p-2 flex justify-between items-center text-sm gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          {p.isGoalkeeper && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-bold shrink-0">
                              GOL
                            </span>
                          )}
                          <span className="font-medium text-slate-700 truncate">{p.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex gap-0.5 text-slate-300">
                            {Array.from({length: p.rating}).map((_, i) => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            ))}
                          </div>

                          <button
                            onClick={() => setTiredModalData({ player: p, team })}
                            className="text-[11px] text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1 transition"
                            title="Jogador cansou ou se machucou: sairá e o time se ajustará automaticamente"
                          >
                            <HeartCrack size={11} className="text-amber-600" />
                            <span>Cansou</span>
                          </button>
                        </div>
                      </li>
                    ))}
                    {team.players.length === 0 && (
                      <li className="p-4 text-center text-slate-400 text-sm">Nenhum jogador escalado</li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {(currentTeams.length > 0 ? currentTeams : generatedTeams).length >= 2 && (
            <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
              <h4 className="font-bold text-emerald-950 mb-3 text-base">Iniciar Partida da Pelada</h4>
              <div className="flex flex-wrap items-center gap-3">
                <select id="teamASelect" className="bg-white border border-emerald-300 rounded-lg p-2.5 text-emerald-950 font-bold focus:ring-2 focus:ring-emerald-500 text-sm">
                  {(currentTeams.length > 0 ? currentTeams : generatedTeams).map(t => <option key={`a_${t.id}`} value={t.id}>{t.name}</option>)}
                </select>
                <span className="font-black text-emerald-600">VS</span>
                <select id="teamBSelect" defaultValue={(currentTeams.length > 0 ? currentTeams : generatedTeams)[1]?.id} className="bg-white border border-emerald-300 rounded-lg p-2.5 text-emerald-950 font-bold focus:ring-2 focus:ring-emerald-500 text-sm">
                  {(currentTeams.length > 0 ? currentTeams : generatedTeams).map(t => <option key={`b_${t.id}`} value={t.id}>{t.name}</option>)}
                </select>
                <button 
                  onClick={() => {
                    const list = currentTeams.length > 0 ? currentTeams : generatedTeams;
                    const selA = (document.getElementById('teamASelect') as HTMLSelectElement).value;
                    const selB = (document.getElementById('teamBSelect') as HTMLSelectElement).value;
                    if (selA === selB) {
                      showToast('Selecione dois times diferentes para o confronto!', 'error');
                      return;
                    }
                    const tA = list.find(t => t.id === selA);
                    const tB = list.find(t => t.id === selB);
                    if (tA && tB) handleStartMatch(tA, tB);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg transition ml-auto shadow-sm flex items-center gap-1.5"
                >
                  <span>Apito Inicial</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Jogador que Cansou / Machucou */}
      <TiredPlayerModal
        isOpen={Boolean(tiredModalData)}
        player={tiredModalData?.player || null}
        team={tiredModalData?.team || null}
        onClose={() => setTiredModalData(null)}
        onConfirm={(pId, tId, reason) => {
          const res = markPlayerTiredOrInjured(pId, tId, reason);
          if (res.success) {
            showToast(res.message, 'success');
          } else {
            showToast(res.message, 'error');
          }
        }}
      />

      {/* Modal de PIN do Organizador */}
      <AdminPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => {
          showToast('Modo Organizador liberado com sucesso!');
        }}
      />

      {/* Modal de Confirmação de Exclusão de Jogador */}
      <ConfirmDeletePlayerModal
        isOpen={Boolean(pendingDeletePlayer)}
        player={pendingDeletePlayer}
        onClose={() => setPendingDeletePlayer(null)}
        onConfirmDelete={handleConfirmDelete}
        onJustRemoveFromToday={(id) => {
          const p = players.find(x => x.id === id);
          if (p) handleLeaveList(p);
        }}
      />

      {/* Modal de confirmação de zerar presenças */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <RotateCcw size={22} />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Zerar Presenças de Hoje?</h3>
            <p className="text-slate-500 text-xs mt-1 mb-5">
              Todos os jogadores confirmados serão desmarcados para que uma nova lista da semana seja iniciada. Nenhum jogador será excluído do elenco.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  clearAllPresence();
                  setShowClearConfirm(false);
                  showToast('Todas as presenças foram zeradas com sucesso!');
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700"
              >
                Sim, Zerar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adição Rápida de Jogador */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Adicionar Jogador</h3>
            <p className="text-xs text-slate-500 mb-4">Cadastre um jogador ou convidado rapidamente.</p>

            <form onSubmit={handleQuickAddSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nome do Jogador</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  placeholder="Ex: Gabriel Jesus"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de Jogador</label>
                <select
                  value={quickType}
                  onChange={(e) => setQuickType(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:border-emerald-500"
                >
                  <option value="mensalista">Mensalista (Fixo)</option>
                  <option value="avulso">Avulso (Convidado)</option>
                </select>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={quickIsGk}
                    onChange={(e) => setQuickIsGk(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <span>É goleiro?</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-xs"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
