import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, Plus, Bell, Clock, AlertCircle } from 'lucide-react';

export function playWhistleSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const playBlast = (startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();

      // Modulation for whistle trill (pea in whistle)
      mod.frequency.setValueAtTime(32, startTime);
      modGain.gain.setValueAtTime(45, startTime);
      mod.connect(osc.frequency);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2700, startTime);
      osc.frequency.exponentialRampToValueAtTime(2950, startTime + duration);

      // Envelope
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.5, startTime + 0.03);
      gain.gain.setValueAtTime(0.5, startTime + duration - 0.03);
      gain.gain.linearRampToValueAtTime(0.001, startTime + duration);

      mod.start(startTime);
      osc.start(startTime);
      mod.stop(startTime + duration);
      osc.stop(startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
    };

    const now = ctx.currentTime;
    // 3 blasts: short, short, long (Apito Final de Pelada!)
    playBlast(now, 0.25);
    playBlast(now + 0.35, 0.25);
    playBlast(now + 0.70, 0.85);

    if (navigator.vibrate) {
      navigator.vibrate([250, 120, 250, 120, 700]);
    }
  } catch (err) {
    console.error('AudioContext error:', err);
  }
}

interface MatchTimerProps {
  onFinishMatch?: () => void;
  matchTitle?: string;
}

export function MatchTimer({ onFinishMatch, matchTitle }: MatchTimerProps) {
  const [initialDuration, setInitialDuration] = useState(600); // 10 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(600);
  const [isRunning, setIsRunning] = useState(false);
  const [showTimeUpAlert, setShowTimeUpAlert] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            setIsRunning(false);
            setShowTimeUpAlert(true);
            playWhistleSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  const toggleRunning = () => {
    // If starting from 0, reset to initial first
    if (timeLeft === 0) {
      setTimeLeft(initialDuration);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = (duration: number = initialDuration) => {
    setIsRunning(false);
    setTimeLeft(duration);
    setInitialDuration(duration);
    setShowTimeUpAlert(false);
  };

  const addExtraMinutes = (mins: number) => {
    setTimeLeft(prev => prev + mins * 60);
    setShowTimeUpAlert(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = Math.min(100, Math.max(0, ((initialDuration - timeLeft) / initialDuration) * 100));

  const isLowTime = timeLeft <= 60 && timeLeft > 0;
  const isTimeOver = timeLeft === 0;

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 md:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
      {/* Background glowing effect */}
      <div className={`absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
        isTimeOver ? 'bg-red-600/30' : isLowTime ? 'bg-amber-500/25' : isRunning ? 'bg-emerald-500/20' : 'bg-slate-700/20'
      }`} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Clock className={isRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'} size={20} />
          <h3 className="font-bold text-base md:text-lg text-slate-100">
            {matchTitle ? `Cronômetro: ${matchTitle}` : 'Cronômetro da Partida'}
          </h3>
        </div>
        <button
          onClick={playWhistleSound}
          title="Testar som do apito"
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
        >
          <Volume2 size={14} className="text-emerald-400" />
          <span>Testar Apito</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-2 rounded-full mb-5 overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            isTimeOver ? 'bg-red-500' : isLowTime ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Digital Clock Display */}
      <div className="flex flex-col items-center justify-center my-2 relative z-10">
        <div className={`text-6xl md:text-7xl font-black font-mono tracking-tight transition-colors ${
          isTimeOver 
            ? 'text-red-500 animate-pulse' 
            : isLowTime 
            ? 'text-amber-400 animate-pulse' 
            : 'text-white'
        }`}>
          {formattedTime}
        </div>
        <span className="text-xs uppercase tracking-widest text-slate-400 mt-1 font-semibold">
          {isTimeOver ? 'Tempo Esgotado' : isRunning ? 'Em Andamento' : 'Pausado'}
        </span>
      </div>

      {/* Main Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-6 relative z-10">
        <button
          onClick={toggleRunning}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-base transition shadow-lg ${
            isRunning 
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950' 
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
          }`}
        >
          {isRunning ? (
            <>
              <Pause size={20} fill="currentColor" />
              Pausar
            </>
          ) : (
            <>
              <Play size={20} fill="currentColor" />
              {timeLeft === 0 ? 'Reiniciar' : 'Iniciar'}
            </>
          )}
        </button>

        <button
          onClick={() => resetTimer(initialDuration)}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition border border-slate-700"
          title="Zerar para o tempo inicial"
        >
          <RotateCcw size={18} />
          <span>Resetar</span>
        </button>

        <button
          onClick={() => addExtraMinutes(1)}
          className="flex items-center justify-center gap-1 px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition border border-slate-700"
          title="Adicionar 1 minuto de acréscimo"
        >
          <Plus size={16} />
          <span>+1 min</span>
        </button>
      </div>

      {/* Preset Duration Buttons */}
      <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-slate-800 text-xs relative z-10">
        <span className="text-slate-400 font-medium mr-1">Tempo padrão:</span>
        {[
          { label: '8 min', val: 480 },
          { label: '10 min', val: 600 },
          { label: '12 min', val: 720 },
          { label: '15 min', val: 900 }
        ].map(p => (
          <button
            key={p.val}
            onClick={() => resetTimer(p.val)}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              initialDuration === p.val 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Time Up Alert Modal / Banner */}
      {showTimeUpAlert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-red-500 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200 text-white">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Bell size={36} />
            </div>
            
            <h3 className="text-2xl font-black text-white mb-2">FIM DE JOGO!</h3>
            <p className="text-slate-300 text-sm mb-6">
              O tempo de <strong>{Math.floor(initialDuration / 60)} minutos</strong> acabou! O apito final soou.
            </p>

            <div className="space-y-3">
              {onFinishMatch && (
                <button
                  onClick={() => {
                    setShowTimeUpAlert(false);
                    onFinishMatch();
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl transition"
                >
                  Encerrar Partida e Salvar
                </button>
              )}

              <button
                onClick={() => addExtraMinutes(2)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition border border-slate-700 flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Dar +2 Min de Acréscimo
              </button>

              <button
                onClick={() => resetTimer(initialDuration)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl transition text-sm"
              >
                Reiniciar Cronômetro (10 min)
              </button>

              <button
                onClick={() => setShowTimeUpAlert(false)}
                className="text-xs text-slate-400 hover:text-white pt-2 block mx-auto underline"
              >
                Dispensar Alerta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
