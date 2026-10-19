import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { UserPlus, Shield, Star, Edit2, Trash2 } from 'lucide-react';

export function Players() {
  const { players, addPlayer, deletePlayer, updatePlayer, isAdmin } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'mensalista' as const,
    rating: 3,
    paymentStatus: 'pendente' as const,
    isGoalkeeper: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updatePlayer(editingId, formData);
      setEditingId(null);
    } else {
      addPlayer(formData);
    }
    setFormData({ name: '', type: 'mensalista', rating: 3, paymentStatus: 'pendente', isGoalkeeper: false });
    setIsAdding(false);
  };

  const startEdit = (player: any) => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Elenco</h2>
        {isAdmin && (
          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingId(null);
              setFormData({ name: '', type: 'mensalista', rating: 3, paymentStatus: 'pendente', isGoalkeeper: false });
            }}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition"
          >
            <UserPlus size={20} />
            <span className="hidden sm:inline">{isAdding ? 'Cancelar' : 'Novo Jogador'}</span>
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full">
            <h3 className="font-semibold text-lg text-slate-800">{editingId ? 'Editar Jogador' : 'Adicionar Jogador'}</h3>
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Nome</label>
            <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-300 rounded-md p-2" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Tipo</label>
            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full border border-slate-300 rounded-md p-2 bg-white">
              <option value="mensalista">Mensalista</option>
              <option value="avulso">Avulso</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600">Nível (1-5)</label>
            <div className="flex items-center gap-1 h-[42px]">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({...formData, rating: star})}
                  className={`${formData.rating >= star ? 'text-amber-400' : 'text-slate-200'}`}
                >
                  <Star size={24} fill={formData.rating >= star ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1 flex items-center mt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.isGoalkeeper} onChange={e => setFormData({...formData, isGoalkeeper: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-sm font-medium text-slate-600 flex items-center gap-1"><Shield size={16}/> Goleiro</span>
            </label>
          </div>

          <div className="col-span-full pt-4">
            <button type="submit" className="w-full sm:w-auto bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition">
              {editingId ? 'Salvar Alterações' : 'Adicionar ao Elenco'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-medium">Nome</th>
                <th className="p-4 font-medium hidden sm:table-cell">Tipo</th>
                <th className="p-4 font-medium text-center">Nível</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {players.map(player => (
                <tr key={player.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <div className="font-medium text-slate-800 flex items-center gap-2">
                      {player.name}
                      {player.isGoalkeeper && <Shield size={14} className="text-slate-400" />}
                    </div>
                    <div className="text-xs text-slate-500 sm:hidden mt-1">{player.type}</div>
                  </td>
                  <td className="p-4 hidden sm:table-cell capitalize text-slate-600">{player.type}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-0.5 text-amber-400">
                      {Array.from({ length: player.rating }).map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {isAdmin && (
                      <>
                        <button onClick={() => startEdit(player)} className="p-2 text-slate-400 hover:text-emerald-600 transition">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => deletePlayer(player.id)} className="p-2 text-slate-400 hover:text-red-600 transition">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">Nenhum jogador cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
