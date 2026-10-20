import React, { useState, useRef } from 'react';
import { useAuth } from '../store/AuthContext';
import { useAppContext } from '../store/AppContext';
import { 
  Settings, Shield, RefreshCw, LogOut, AlertTriangle, Users, Lock, Key, 
  Database, Download, Upload, ExternalLink, HardDrive, CheckCircle2, Cloud, Sparkles 
} from 'lucide-react';

interface AdminPanelProps {
  setCurrentTab: (tab: string) => void;
}

export function AdminPanel({ setCurrentTab }: AdminPanelProps) {
  const { user, login, logout, isLoggingIn, error: authError } = useAuth();
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
    setPaymentStatus,
    exportBackup,
    restoreBackup
  } = useAppContext();

  const [tempPixKey, setTempPixKey] = useState(pixKey || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showDomainHelp, setShowDomainHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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


  const handleDownloadBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportBackup());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `grota_fc_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const success = restoreBackup(parsed);
        if (success) {
          alert('Backup restaurado com sucesso! Os jogadores e partidas foram atualizados.');
        } else {
          alert('Formato de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao processar o arquivo de backup.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
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
          className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1 cursor-pointer"
        >
          <LogOut size={16} /> Sair do Admin
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Admin" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg border-2 border-white shadow-sm">
                ⚽
              </div>
            )}
            <div>
              <div className="font-bold text-slate-800">{user?.displayName || 'Administrador (Grota F.C)'}</div>
              <div className="text-xs text-slate-500">{user?.email || 'Acesso Direto (Senha 162222)'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Modo Ativo
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Configurações de Regra e Pix */}
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
                    className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition cursor-pointer"
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

          {/* Backup e Restauração */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
              <HardDrive size={18} className="text-slate-400" /> Backup e Segurança dos Dados
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Seus dados já ficam salvos no navegador. Use estes botões para salvar uma cópia no seu celular/computador ou restaurar em outro aparelho.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadBackup}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold rounded-xl text-xs hover:bg-emerald-100 transition cursor-pointer"
              >
                <Download size={15} /> Baixar Backup
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 border border-slate-300 text-slate-800 font-semibold rounded-xl text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                <Upload size={15} /> Restaurar Arquivo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Banco de Dados Firebase */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Database size={18} className="text-amber-500" /> Banco de Dados Firebase
              </h3>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${user && user.uid !== 'guest_local' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {user && user.uid !== 'guest_local' ? 'Nuvem Conectada' : 'Modo Local'}
              </span>
            </div>
            
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              O aplicativo usa o <strong>Firebase Cloud Firestore</strong> para persistência de dados em tempo real e autenticação segura com o Google.
            </p>

            <div className="space-y-3">
              {user && user.uid !== 'guest_local' ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Sincronizado na nuvem com o Firebase!
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Conta: <strong>{user.email || user.displayName}</strong>
                  </p>
                  <p className="text-[11px] text-emerald-600">
                    Qualquer alteração em jogadores e partidas é salva automaticamente no Cloud Firestore.
                  </p>
                  <button
                    onClick={() => logout()}
                    className="mt-1 text-xs text-emerald-800 underline font-semibold hover:text-emerald-900 cursor-pointer"
                  >
                    Desconectar conta Google
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
                    <HardDrive size={15} className="text-indigo-600" />
                    Armazenamento Local no Aparelho
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Seus dados estão salvos com segurança neste navegador. Para sincronizar em tempo real com outros celulares ou organizadores, conecte com o Google:
                  </p>
                  <button
                    onClick={() => login()}
                    disabled={isLoggingIn}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs transition disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <Cloud size={15} />
                    {isLoggingIn ? 'Conectando ao Firebase...' : 'Conectar ao Firebase (Google)'}
                  </button>
                  {authError && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-[11px] mt-2">
                      {authError}
                    </div>
                  )}
                </div>
              )}

              {/* Ajuda para liberar o domínio da Hostinger no Firebase */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowDomainHelp(!showDomainHelp)}
                  className="w-full flex items-center justify-between text-left font-semibold text-xs text-slate-700 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    Como autorizar o link da Hostinger no Firebase
                  </span>
                  <span className="text-slate-400 text-xs">{showDomainHelp ? '▲' : '▼'}</span>
                </button>

                {showDomainHelp && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200 text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                    <p className="font-semibold text-slate-700">
                      Caso veja o erro <code>auth/unauthorized-domain</code> ao clicar em Entrar com Google:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                      <li>Acesse o console do Firebase no navegador.</li>
                      <li>Vá no menu <strong>Authentication</strong> e clique na aba <strong>Settings</strong>.</li>
                      <li>Role até a seção <strong>Authorized domains (Domínios autorizados)</strong>.</li>
                      <li>Clique em <strong>Add domain</strong> e adicione <code>hostingersite.com</code> (ou o domínio do seu site).</li>
                    </ol>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Enquanto isso, você pode continuar usando o aplicativo normalmente no modo local e usar os botões de "Baixar Backup" para segurança!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ações em Lote e Sair */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
              <Users size={18} className="text-slate-400" /> Ações em Lote
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={handleResetPayments}
                className="w-full flex items-center justify-between p-3 border border-amber-200 bg-amber-50 rounded-lg hover:bg-amber-100 transition text-amber-700 font-medium text-xs cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw size={16} />
                  Virar Mês (Marcar Todos Como Pendentes)
                </span>
              </button>

              <button
                onClick={() => {
                  setIsAdmin(false);
                  setCurrentTab('dashboard');
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium text-xs cursor-pointer"
              >
                <LogOut size={15} />
                Sair do Painel Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
