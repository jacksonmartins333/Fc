import { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './store/AppContext';
import { AuthProvider, useAuth } from './store/AuthContext';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Players } from './components/Players';
import { Finance } from './components/Finance';
import { MatchDay } from './components/MatchDay';
import { Gamecenter } from './components/Gamecenter';
import { AdminPanel } from './components/AdminPanel';
import { RulesModal } from './components/RulesModal';
import { LogOut } from 'lucide-react';

function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) return null; // Should not happen anymore

  return (
    <div className="mt-auto p-4 border-t border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-2 overflow-hidden">
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
            {user.displayName?.[0] || 'U'}
          </div>
        )}
        <div className="text-sm font-medium text-slate-700 truncate">
          {user.displayName || 'Usuário'}
        </div>
      </div>
      <button 
        onClick={logout}
        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
        title="Sair"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}

function AppContent() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const { user, login, logout, isLoggingIn, error, clearError } = useAuth();
  const { isAdmin } = useAppContext();

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-transparent overflow-hidden">
            <img src="/logo.png" alt="Grota F.C Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Grota F.C</h1>
          <p className="text-slate-500 mb-8">Gerencie sua pelada com facilidade. Faça login para continuar.</p>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex flex-col gap-2">
              <p>{error}</p>
              <button 
                onClick={clearError}
                className="text-red-700 font-bold hover:underline self-end"
              >
                Entendi
              </button>
            </div>
          )}
          
          <button
            onClick={login}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-3 px-4 rounded-xl transition shadow-sm disabled:opacity-50"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            {isLoggingIn ? 'Conectando...' : 'Entrar com Google'}
          </button>
          
          <div className="mt-4 w-full [&>button]:w-full [&>button]:py-3">
            <RulesModal />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar for Desktop, Bottom Nav for Mobile */}
      <div className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-lg bg-transparent overflow-hidden">
            <img src="/logo.png" alt="Grota F.C Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-xl tracking-tight text-slate-800">Grota F.C</span>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <Navigation currentTab={currentTab} setCurrentTab={setCurrentTab} />
          <div className="flex-1"></div>
          <UserProfile />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pb-24 md:pb-0 min-h-screen">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-transparent overflow-hidden">
              <img src="/logo.png" alt="Grota F.C Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-lg tracking-tight text-slate-800">Grota F.C</span>
          </div>
          <div>
            <button 
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <main className="p-4 md:p-8 max-w-6xl mx-auto">
          {currentTab === 'dashboard' && <Dashboard setCurrentTab={setCurrentTab} />}
          {currentTab === 'players' && <Players />}
          {currentTab === 'finance' && <Finance />}
          {currentTab === 'matchday' && <MatchDay setCurrentTab={setCurrentTab} />}
          {currentTab === 'gamecenter' && <Gamecenter />}
          {currentTab === 'admin' && <AdminPanel setCurrentTab={setCurrentTab} />}
        </main>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden">
        <Navigation currentTab={currentTab} setCurrentTab={setCurrentTab} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
