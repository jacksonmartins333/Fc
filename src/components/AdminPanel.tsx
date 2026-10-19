import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { useAppContext } from '../store/AppContext';
import { Settings, Shield, RefreshCw, LogOut, AlertTriangle, Users, Lock, Key, ArrowLeft } from 'lucide-react';

interface AdminPanelProps {
  setCurrentTab: (tab: string) => void;
}

export function AdminPanel({ setCurrentTab }: AdminPanelProps) {
  const { user, logout } = useAuth();
  const { 
    isAdmin,
    setIsAdmin,
    pixKey, 
    setPixKey, 
    maxPlayersPerTeam, 
    setMaxPlayersPerTeam, 
    numberOfTeams, 
    setNumberOfTeams,
    players,
    setPaymentStatus
  } = useAppContext();

  const [tempPixKey, setTempPixKey] = useState(pixKey || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '162222') {
      setIsAdmin(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full text-center">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-indigo-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Acesso Administrativo</h2>
          <p className="text-slate-500 mb-6">Digite a senha para acessar as configurações.</p>
          
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${error ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'} outline-none transition`}
                  autoFocus
                />
              </div>
              {error && <p className="text-red-500 text-sm mt-2 text-left">Senha incorreta. Tente novamente.</p>}
            </div>
            
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition"
            >
              Acessar Painel
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab('dashboard')}
              className="w-full bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition"
            >
              Voltar ao Início
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleResetPayments = () => {
    if (window.confirm('Tem certeza que deseja marcar todos os jogadores como "pendente"? Isso é útil para iniciar um novo mês sem apagar os jogadores.')) {
      players.forEach(p => {
        if (p.paymentStatus !== 'pendente') {
          setPaymentStatus(p.id, 'pendente');
        }
      });
      alert('Todos os jogadores foram marcados como pendentes.');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="text-indigo-600" size={28} />
          <h2 className="text-2xl font-bold text-slate-800">Painel do Administrador</h2>
        </div>
        <button 
          onClick={() => {
            setIsAdmin(false);
            setCurrentTab('dashboard');
          }}
          className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1"
        >
          <LogOut size={16} /> Sair do Admin
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Admin" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg border-2 border-white shadow-sm">
              {user.displayName?.[0] || 'A'}
            </div>
          )}
          <div>
            <div className="font-bold text-slate-800">{user.displayName || 'Administrador'}</div>
            <div className="text-sm text-slate-500">{user.email}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Settings size={18} className="text-slate-400" /> Configurações da Pelada
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chave PIX (Recebimento)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempPixKey}
                    onChange={(e) => setTempPixKey(e.target.value)}
                    placeholder="CPF, Celular, Email..."
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  />
                  <button
                    onClick={() => {
                      setPixKey(tempPixKey);
                      alert('Chave PIX atualizada com sucesso!');
                    }}
                    className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition"
                  >
                    Salvar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jogadores por Time</label>
                <select
                  value={maxPlayersPerTeam}
                  onChange={(e) => setMaxPlayersPerTeam(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  {[4, 5, 6, 7, 8, 9, 10, 11].map(n => (
                    <option key={n} value={n}>{n} na linha + Goleiro</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Número de Times (Sorteio)</label>
                <select
                  value={numberOfTeams}
                  onChange={(e) => setNumberOfTeams(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  {[2, 3, 4].map(n => (
                    <option key={n} value={n}>{n} Times</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Users size={18} className="text-slate-400" /> Ações em Lote
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={handleResetPayments}
                className="w-full flex items-center justify-between p-3 border border-amber-200 bg-amber-50 rounded-lg hover:bg-amber-100 transition text-amber-700 font-medium"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw size={18} />
                  Virar Mês (Todos Pendentes)
                </span>
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <LogOut size={18} className="text-slate-400" /> Sair
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsAdmin(false);
                  setCurrentTab('dashboard');
                }}
                className="w-full flex items-center justify-center gap-2 p-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
              >
                <LogOut size={18} />
                Sair do Painel Admin
              </button>
              
              <button
                onClick={() => {
                  if(window.confirm('Deseja realmente desconectar sua conta?')) {
                    logout();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 p-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition font-medium"
              >
                <AlertTriangle size={18} />
                Desconectar Conta (Log Out)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
