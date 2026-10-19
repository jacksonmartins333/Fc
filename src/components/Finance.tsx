import React, { useMemo, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { CheckCircle2, AlertCircle, XCircle, QrCode, X, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import { generatePixPayload } from '../lib/pix';

export function Finance() {
  const { players, setPaymentStatus, pixKey, isAdmin } = useAppContext();
  const [selectedPlayer, setSelectedPlayer] = useState<typeof players[0] | null>(null);

  const stats = useMemo(() => {
    return {
      pago: players.filter(p => p.paymentStatus === 'pago').length,
      pendente: players.filter(p => p.paymentStatus === 'pendente').length,
      atrasado: players.filter(p => p.paymentStatus === 'atrasado').length,
      total: players.length
    };
  }, [players]);

  const statusConfig = {
    pago: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Pago' },
    pendente: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Pendente' },
    atrasado: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Atrasado' }
  };

  const handleExport = () => {
    const data = new Date().toLocaleDateString('pt-BR');
    
    let content = `Resumo Financeiro - ${data}\n\n`;
    content += `Estatísticas:\n`;
    content += `- Pagos: ${stats.pago}\n`;
    content += `- Pendentes: ${stats.pendente}\n`;
    content += `- Atrasados: ${stats.atrasado}\n`;
    content += `- Total de Jogadores: ${stats.total}\n\n`;
    
    content += `Lista de Mensalidades:\n`;
    players.forEach(p => {
      content += `- ${p.name} (${p.type}): ${p.paymentStatus.toUpperCase()}\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `resumo_mensalidades_${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pixPayload = selectedPlayer ? generatePixPayload(pixKey, 'Grota F.C', 'Cidade') : '';

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Controle de Caixa</h2>
        <button
          onClick={handleExport}
          className="bg-indigo-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition text-sm font-medium"
        >
          <Download size={18} />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(stats).filter(([k]) => k !== 'total').map(([status, count]) => {
          const config = statusConfig[status as keyof typeof statusConfig];
          const Icon = config.icon;
          return (
            <div key={status} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
              <div className={`p-3 rounded-full ${config.bg} ${config.color} mb-2`}>
                <Icon size={24} />
              </div>
              <span className="text-2xl font-bold text-slate-800">{count}</span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{config.label}</span>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">Status por Jogador</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {players.map(player => (
            <div key={player.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/50 transition gap-4">
              <div className="flex justify-between sm:justify-start items-center sm:items-start w-full sm:w-auto">
                <div>
                  <div className="font-medium text-slate-800">{player.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{player.type}</div>
                </div>
                {player.paymentStatus !== 'pago' && pixKey && (
                  <button
                    onClick={() => setSelectedPlayer(player)}
                    className="sm:hidden flex items-center gap-1 text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-1 rounded"
                  >
                    <QrCode size={14} /> PIX
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                <div className="flex gap-2 shrink-0">
                  {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map(status => {
                    const isActive = player.paymentStatus === status;
                    const config = statusConfig[status];
                    return (
                      <button
                        key={status}
                        onClick={() => isAdmin && setPaymentStatus(player.id, status)}
                        disabled={!isAdmin}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isActive 
                            ? `${config.bg} ${config.color} ring-1 ring-inset ring-${config.color.split('-')[1]}-200` 
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        } ${!isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
                
                {player.paymentStatus !== 'pago' && pixKey && (
                  <button
                    onClick={() => setSelectedPlayer(player)}
                    className="flex shrink-0 items-center justify-center bg-emerald-100 text-emerald-700 hover:bg-emerald-200 p-2 rounded-lg transition ml-2"
                    title="Receber com PIX"
                  >
                    <QrCode size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {players.length === 0 && (
            <div className="p-8 text-center text-slate-500">Nenhum jogador cadastrado.</div>
          )}
        </div>
      </div>

      {/* PIX Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-50 p-4 flex justify-between items-center border-b border-emerald-100">
              <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                <QrCode size={20} />
                Receber de {selectedPlayer.name}
              </h3>
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="text-emerald-700 hover:bg-emerald-100 p-1 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 flex flex-col items-center bg-white">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                <QRCode value={pixPayload} size={200} />
              </div>
              
              <div className="text-center w-full">
                <p className="text-sm text-slate-500 mb-2">Chave PIX:</p>
                <p className="font-mono text-lg font-bold text-slate-800 break-all bg-slate-50 p-2 rounded border border-slate-100">{pixKey}</p>
              </div>
              
              {isAdmin && (
                <button
                  onClick={() => {
                    setPaymentStatus(selectedPlayer.id, 'pago');
                    setSelectedPlayer(null);
                  }}
                  className="mt-8 w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition"
                >
                  Confirmar Pagamento
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
