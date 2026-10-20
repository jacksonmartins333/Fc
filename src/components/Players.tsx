import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { 
  UserPlus, Shield, Star, Edit2, Trash2, Search, 
  Lock, Unlock, AlertCircle, CheckCircle2, UserMinus, UserCheck 
} from 'lucide-react';
import { Player } from '../types';
import { AdminPinModal } from './AdminPinModal';
import { ConfirmDeletePlayerModal } from './ConfirmDeletePlayerModal';

export function Players() {
  const { players, addPlayer, deletePlayer, updatePlayer, setPlayerPresence, isAdmin } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingDeletePlayer, setPendingDeletePlayer] = useState<Player | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'mensalista' as const,
    rating: 3,
    paymentStatus: 'pendente' as const,
    isGoalkeeper: false,
  });

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleStartAdd = () => {
    if (!isAdmin) {
      setShowPinModal(true);
      return;
    }
    setIsAdding(!isAdding);
    setEditingId(null);
    setFormData({ name: '', type: 'mensalista', rating: 3, paymentStatus: 'pendente', isGoalkeeper: false });
  };

  const handleStartEdit = (player: Player) => {
    if (!isAdmin) {
      setShowPinModal(true);
      return;
    }
    setFormData({
      name: player.name,
      type: player.type,
      rating: player.rating,
      paymentStatus: player.paymentStatus,
      isGoalkeeper: player.isGoalkeeper,
    });
    setEditingId(player.id);
    setIsAdding(true);
  };

  const handleDeleteRequest = (player: Player) => {
    if (!isAdmin) {
      setShowPinModal(true);
      return;
    }
    setPendingDeletePlayer(player);
  };

  const handleConfirmDelete = (id: string) => {
    const p = players.find(x => x.id === id);
    deletePlayer(id);
    showNotification(`${p?.name || 'Jogador'} foi removido com sucesso.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updatePlayer(editingId, formData);
      showNotification(`${formData.name} atualizado com sucesso!`);
      setEditingId(null);
    } else {
      addPlayer(formData);
      showNotification(`${formData.name} adicionado ao elenco!`);
    }
    setFormData({ name: '', type: 'mensalista', rating: 3, paymentStatus: 'pendente', isGoalkeeper: false });
    setIsAdding(false);
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold animate-in slide-in-from-top duration-300">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Elenco de Jogadores</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Cadastre, edite ou remova quem não joga mais no grupo.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isAdmin ? (
            <button
              onClick={() => setShowPinModal(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              title="Acesso com PIN 162222"
            >
              <Lock size={14} className="text-slate-500" />
              <span>Desbloquear Edição</span>
            </button>
          ) : (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <Unlock size={14} className="text-emerald-600" />
              <span>Edição Liberada</span>
            </div>
          )}

          <button
            onClick={handleStartAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm font-bold shadow-xs"
          >
            <UserPlus size={18} />
            <span>{isAdding ? 'Cancelar' : 'Novo Jogador'}</span>
          </button>
        </div>
      </div>

      {/* Search and Helper */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar jogador por nome..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-emerald-500 transition"
          />
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <AlertCircle size={15} className="text-slate-400" />
          <span>Para excluir quem não joga mais, clique no ícone da lixeira ao lado do nome.</span>
        </div>
      </div>

      {/* Form de Adicionar/Editar */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-200">
          <div className="col-span-full border-b border-slate-100 pb-2">
            <h3 className="font-bold text-lg text-slate-800">
              {editingId ? 'Editar Dados do Jogador' : 'Adicionar Novo Jogador'}
            </h3>
            <p className="text-xs text-slate-500">Preencha os dados do atleta para o elenco.</p>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Nome Completo / Apelido</label>
            <input 
              required 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-500" 
              placeholder="Ex: Romário"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Tipo de Atleta</label>
            <select 
              value={formData.type} 
              onChange={e => setFormData({...formData, type: e.target.value as any})} 
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white outline-none focus:border-emerald-500"
            >
              <option value="mensalista">Mensalista (Fixo)</option>
              <option value="avulso">Avulso (Convidado)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Nível Técnico (1 a 5 estrelas)</label>
            <div className="flex items-center gap-1 h-[42px]">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({...formData, rating: star})}
                  className={`p-1 transition ${formData.rating >= star ? 'text-amber-400 scale-105' : 'text-slate-200'}`}
                >
                  <Star size={24} fill={formData.rating >= star ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1 flex items-center pt-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={formData.isGoalkeeper} 
                onChange={e => setFormData({...formData, isGoalkeeper: e.target.checked})} 
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
              />
              <span className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                <Shield size={16} className="text-amber-600" /> É Goleiro
              </span>
            </label>
          </div>

          <div className="col-span-full pt-4 flex gap-2">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)} 
              className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200 transition"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-emerald-700 transition shadow-xs"
            >
              {editingId ? 'Salvar Alterações' : 'Adicionar ao Elenco'}
            </button>
          </div>
        </form>
      )}

      {/* Tabela de Jogadores */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="p-4">Jogador</th>
                <th className="p-4 hidden sm:table-cell">Tipo</th>
                <th className="p-4 text-center">Nível</th>
                <th className="p-4 hidden md:table-cell text-center">Status no Jogo</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlayers.map(player => (
                <tr key={player.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <span>{player.name}</span>
                      {player.isGoalkeeper && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5">
                          <Shield size={10} /> GOL
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 sm:hidden mt-0.5 capitalize">
                      {player.type} • {player.isPresent ? '✓ Na lista' : 'Fora da lista'}
                    </div>
                  </td>

                  <td className="p-4 hidden sm:table-cell">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      player.type === 'mensalista' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                        : 'bg-purple-50 text-purple-700 border border-purple-100'
                    }`}>
                      {player.type}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex justify-center gap-0.5 text-amber-400">
                      {Array.from({ length: player.rating }).map((_, i) => (
                        <Star key={i} size={15} fill="currentColor" />
                      ))}
                    </div>
                  </td>

                  <td className="p-4 hidden md:table-cell text-center">
                    {player.isPresent ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <UserCheck size={13} /> Confirmado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                        <UserMinus size={13} /> Ausente
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleStartEdit(player)} 
                        className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition"
                        title="Editar jogador"
                        aria-label={`Editar ${player.name}`}
                      >
                        <Edit2 size={17} />
                      </button>
                      <button 
                        onClick={() => handleDeleteRequest(player)} 
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        title="Remover quem não joga mais (Excluir do elenco)"
                        aria-label={`Excluir ${player.name}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredPlayers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                    {search ? `Nenhum jogador encontrado com "${search}".` : 'Nenhum jogador cadastrado no elenco.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de PIN */}
      <AdminPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => {
          showNotification('Acesso do organizador liberado!');
        }}
      />

      {/* Modal de Confirmação de Remoção */}
      <ConfirmDeletePlayerModal
        isOpen={Boolean(pendingDeletePlayer)}
        player={pendingDeletePlayer}
        onClose={() => setPendingDeletePlayer(null)}
        onConfirmDelete={handleConfirmDelete}
        onJustRemoveFromToday={(id) => {
          setPlayerPresence(id, false);
          showNotification('Jogador retirado da lista de hoje.');
        }}
      />
    </div>
  );
}
