import React from 'react';
import { Users, DollarSign, Calendar, Trophy, LayoutDashboard, Settings } from 'lucide-react';
import { useAppContext } from '../store/AppContext';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export function Navigation({ currentTab, setCurrentTab }: NavigationProps) {
  const { isAdmin } = useAppContext();

  const allNavItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'players', label: 'Elenco', icon: Users },
    { id: 'finance', label: 'Caixa', icon: DollarSign },
    { id: 'matchday', label: 'Lista', icon: Calendar },
    { id: 'gamecenter', label: 'Resenha', icon: Trophy },
    { id: 'admin', label: 'Admin', icon: Settings },
  ];

  const navItems = allNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 pb-safe pt-2 z-50 md:relative md:border-none md:p-0 md:bg-transparent">
      <div className="flex justify-between md:flex-col md:space-y-1 md:space-x-0 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col md:flex-row items-center p-2 min-w-[56px] md:min-w-0 md:w-full md:justify-start md:px-4 md:py-3 md:rounded-xl transition-colors ${
                isActive 
                  ? 'text-emerald-600 md:bg-emerald-50 md:text-emerald-700' 
                  : 'text-slate-500 hover:text-slate-800 md:hover:bg-slate-50'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="mb-1 md:mb-0 md:mr-3" />
              <span className={`text-[10px] md:text-sm font-medium ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
