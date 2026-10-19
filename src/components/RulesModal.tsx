import { useState } from 'react';
import { BookOpen, X, CheckCircle2 } from 'lucide-react';

export function RulesModal() {
  const [isOpen, setIsOpen] = useState(false);

  const rules = [
    { title: "Mensalidade ou Pix em Dia", desc: "Regra número um da sobrevivência da pelada. Quem não contribui com o valor do campo, da bola não entra em campo. Sem choro." },
    { title: "A Palavra do Juiz é Lei", desc: "Acabou a bagunça. O que o árbitro marcar, tá marcado e não se discute. Quem ficar enchendo o saco do juiz toma cartão amarelo ou fica 2 minutos de castigo fora de campo." },
    { title: "Tempo de Jogo e Gols", desc: "Partidas duram 10 minutos cravados no apito do juiz ou acabam quando um time fizer 2 gols. Em caso de empate, sai os dois times." },
    { title: "Rodízio no Gol", desc: "Se não houver goleiros fixos, o rodízio é obrigatório." },
    { title: "Chegou Atrasado, Vai pro Fim da Fila", desc: "Quem chega depois que os times já foram divididos vai direto para o banco de reservas esperar o próximo time se formar." },
    { title: "Equipamento Correto", desc: "Chuteira adequada para o tipo de campo (society ou quadra). O árbitro fará a vistoria antes de rolar a bola. As canelas dos amigos agradecem." },
    { title: "Proibido \"Panelinha\"", desc: "Os times devem ser tirados na hora, no par ou ímpar, de forma justa." },
    { title: "Cartão Vermelho é Rua", desc: "Futebol é esporte de contato, mas deslealdade não. Deu entrada maldosa ou quis arrumar briga? O juiz puxa o vermelho do bolso, o jogador é expulso da pelada do dia e ainda paga a cerveja da vítima." },
    { title: "AGRESSÃO", desc: "Qualquer tipo de agressão física o jogador será expulso definitivamente da pelada." },
    { title: "A Resenha Pós-Jogo é Obrigatória", desc: "O \"terceiro tempo\" é sagrado. Ficar para cornetar as marcações duvidosas do juiz, os gols perdidos e tomar uma bebida com os parceiros é o que mantém o espírito do Grota F.C. vivo." }
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold py-2 px-4 rounded-xl transition shadow-sm"
      >
        <BookOpen size={18} />
        Regras da Pelada
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <BookOpen className="text-emerald-600" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Regras Sagradas da Pelada</h2>
                  <p className="text-sm text-slate-500">Grota F.C</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50 flex-1">
              {rules.map((rule, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center gap-3">
                  <div className="shrink-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                      {idx + 1}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">{rule.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{rule.desc}</p>
                  </div>
                </div>
              ))}
              
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mt-6 text-center">
                <p className="text-emerald-800 font-medium text-sm">
                  O que achou do novo regulamento? Alguma regra precisa ficar mais rígida?
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white">
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
