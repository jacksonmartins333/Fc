import React from 'react';
import { useAppContext } from '../store/AppContext';
import { Trophy, Users, CheckSquare } from 'lucide-react';
import { RulesModal } from './RulesModal';

export function Dashboard({ setCurrentTab }: { setCurrentTab: (tab: string) => void }) {
  const { players } = useAppContext();

  const presentCount = players.filter(p => p.isPresent).length;
  const pendingPayments = players.filter(p => p.paymentStatus !== 'pago').length;
  
  const matchesWonByTopPlayer = players.length > 0 
    ? Math.max(...players.map(p => p.stats.matchesWon))
    : 0;
    
  const topPlayers = players.filter(p => p.stats.matchesWon === matchesWonByTopPlayer && matchesWonByTopPlayer > 0);

  return (
    <div className="space-y-8">
      <div className="bg-slate-800 text-white rounded-2xl p-8 relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 tracking-tight">Grota F.C</h1>
          <p className="text-slate-300 max-w-sm leading-relaxed mb-6">
            O centro de comando da sua pelada. Gerencie jogadores, finanças e acompanhe as estatísticas da temporada.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={() => setCurrentTab('matchday')}
              className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-2.5 px-6 rounded-lg transition shadow-lg shadow-emerald-500/20"
            >
              Iniciar Lista de Hoje
            </button>
            <div className="[&>button]:bg-slate-700 [&>button]:border-slate-600 [&>button]:text-white [&>button:hover]:bg-slate-600">
              <RulesModal />
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <button 
          onClick={() => setCurrentTab('matchday')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 transition group text-left flex flex-col"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <CheckSquare size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg mb-1">Presença</h3>
          <p className="text-slate-500 text-sm mb-4 flex-1">
            {presentCount} jogadores confirmados para a próxima partida.
          </p>
          <div className="text-emerald-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
            Gerenciar lista &rarr;
          </div>
        </button>

        <button 
          onClick={() => setCurrentTab('finance')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-amber-500 transition group text-left flex flex-col"
        >
          <div className="p-3 bg-amber-50 text-amber-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg mb-1">Caixa</h3>
          <p className="text-slate-500 text-sm mb-4 flex-1">
            {pendingPayments} jogadores com pagamento pendente/atrasado.
          </p>
          <div className="text-amber-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
            Ver pagamentos &rarr;
          </div>
        </button>

        <button 
          onClick={() => setCurrentTab('gamecenter')}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition group text-left flex flex-col sm:col-span-2 lg:col-span-1"
        >
          <div className="p-3 bg-blue-50 text-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Trophy size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg mb-1">Gamecenter</h3>
          <p className="text-slate-500 text-sm mb-4 flex-1">
            {topPlayers.length > 0 
              ? `Rei atual: ${topPlayers.map(p => p.name).join(', ')} com ${matchesWonByTopPlayer} vitórias.` 
              : 'Nenhuma partida registrada ainda.'}
          </p>
          <div className="text-blue-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
            Abrir ranking &rarr;
          </div>
        </button>
      </div>
    </div>
  );
}

