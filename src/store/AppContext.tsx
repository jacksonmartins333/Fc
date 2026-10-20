import React, { createContext, useContext, useState, useEffect } from 'react';
import { Player, Match, Team } from '../types';
import { useAuth } from './AuthContext';
import { 
  subscribeToPlayers, subscribeToMatches, subscribeToSettings, 
  savePlayer, deletePlayer, saveMatch, saveSettings 
} from '../lib/db';
import { 
  saveToSupabase, loadFromSupabase, getSupabaseConfig 
} from '../lib/supabase';

interface AppState {
  players: Player[];
  matches: Match[];
  maxPlayersPerTeam: number;
  numberOfTeams: number;
  pixKey: string;
}

interface AppContextType extends AppState {
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  addPlayer: (player: Omit<Player, 'id' | 'stats' | 'isPresent'>) => void;
  updatePlayer: (id: string, player: Partial<Player>) => void;
  deletePlayer: (id: string) => void;
  togglePresence: (id: string) => void;
  setPaymentStatus: (id: string, status: Player['paymentStatus']) => void;
  generateTeams: (balanced: boolean) => Team[];
  startMatch: (teamA: Team, teamB: Team) => void;
  updateMatchScore: (matchId: string, teamId: string, type: 'goal' | 'assist', playerId?: string) => void;
  finishMatch: (matchId: string) => void;
  setMaxPlayersPerTeam: (max: number) => void;
  setNumberOfTeams: (num: number) => void;
  setPixKey: (key: string) => void;
  exportBackup: () => string;
  restoreBackup: (jsonData: any) => boolean;
  syncSupabaseNow: () => Promise<{ success: boolean; error?: string }>;
}

const defaultState: AppState = {
  players: [],
  matches: [],
  maxPlayersPerTeam: 5,
  numberOfTeams: 2,
  pixKey: '',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('pelada_fc_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultState, ...parsed };
      } catch (e) {
        console.error('Failed to parse state from localStorage');
      }
    }
    return {
      ...defaultState,
      players: [
        { id: '1', name: 'João', type: 'mensalista', rating: 4, paymentStatus: 'pago', isGoalkeeper: false, isPresent: false, stats: { goals: 0, assists: 0, matchesWon: 0, matchesPlayed: 0, goalsConceded: 0 } },
        { id: '2', name: 'Carlos', type: 'mensalista', rating: 3, paymentStatus: 'pendente', isGoalkeeper: false, isPresent: false, stats: { goals: 0, assists: 0, matchesWon: 0, matchesPlayed: 0, goalsConceded: 0 } },
        { id: '3', name: 'Marcos', type: 'mensalista', rating: 5, paymentStatus: 'atrasado', isGoalkeeper: false, isPresent: false, stats: { goals: 0, assists: 0, matchesWon: 0, matchesPlayed: 0, goalsConceded: 0 } },
        { id: '4', name: 'Lucas', type: 'avulso', rating: 2, paymentStatus: 'pago', isGoalkeeper: true, isPresent: false, stats: { goals: 0, assists: 0, matchesWon: 0, matchesPlayed: 0, goalsConceded: 0 } },
        { id: '5', name: 'Pedro', type: 'avulso', rating: 3, paymentStatus: 'pago', isGoalkeeper: false, isPresent: false, stats: { goals: 0, assists: 0, matchesWon: 0, matchesPlayed: 0, goalsConceded: 0 } },
      ]
    };
  });

  const [isAdmin, setIsAdminState] = useState(() => sessionStorage.getItem('admin_unlocked') === 'true');

  const setIsAdmin = (val: boolean) => {
    setIsAdminState(val);
    if (val) {
      sessionStorage.setItem('admin_unlocked', 'true');
    } else {
      sessionStorage.removeItem('admin_unlocked');
    }
  };

  useEffect(() => {
    localStorage.setItem('pelada_fc_state', JSON.stringify(state));
    const { isConfigured } = getSupabaseConfig();
    if (isConfigured) {
      const timer = setTimeout(() => {
        saveToSupabase(state);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  useEffect(() => {
    const { isConfigured } = getSupabaseConfig();
    if (isConfigured) {
      loadFromSupabase().then(res => {
        if (res.success && res.data) {
          setState(s => ({
            ...s,
            ...res.data,
            players: Array.isArray(res.data.players) && res.data.players.length > 0 ? res.data.players : s.players,
            matches: Array.isArray(res.data.matches) ? res.data.matches : s.matches,
          }));
        }
      });
    }
  }, []);

  const isFirebaseUser = Boolean(user && user.uid && user.uid !== 'guest_local');

  useEffect(() => {
    if (!isFirebaseUser || !user) return;
    
    const unsubPlayers = subscribeToPlayers(user.uid, (firestorePlayers) => {
      setState(s => {
        if (firestorePlayers.length === 0 && s.players.length > 0) {
          s.players.forEach(p => {
            savePlayer(user.uid, p, true);
          });
          return s;
        }
        return { ...s, players: firestorePlayers };
      });
    });
    
    const unsubMatches = subscribeToMatches(user.uid, (firestoreMatches) => {
      setState(s => {
        if (firestoreMatches.length === 0 && s.matches.length > 0) {
          s.matches.forEach(m => {
            saveMatch(user.uid, m, true);
          });
          return s;
        }
        return { ...s, matches: firestoreMatches };
      });
    });

    const unsubSettings = subscribeToSettings(user.uid, (settings) => {
      setState(s => ({
        ...s,
        pixKey: settings?.pixKey ?? s.pixKey,
        maxPlayersPerTeam: settings?.maxPlayersPerTeam ?? s.maxPlayersPerTeam,
        numberOfTeams: settings?.numberOfTeams ?? s.numberOfTeams,
      }));
    });

    return () => {
      unsubPlayers();
      unsubMatches();
      unsubSettings();
    };
  }, [user, isFirebaseUser]);

  const addPlayer = (playerData: Omit<Player, 'id' | 'stats' | 'isPresent'>) => {
    const newPlayer: Player = {
      ...playerData,
      id: Math.random().toString(36).substr(2, 9),
      isPresent: false,
      stats: { goals: 0, assists: 0, matchesWon: 0, matchesPlayed: 0, goalsConceded: 0 },
    };
    setState(s => ({ ...s, players: [...s.players, newPlayer] }));
    if (isFirebaseUser && user) savePlayer(user.uid, newPlayer, true);
  };

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    const playerIndex = state.players.findIndex(p => p.id === id);
    if (playerIndex === -1) return;
    const updatedPlayer = { ...state.players[playerIndex], ...updates };
    
    setState(s => ({
      ...s,
      players: s.players.map(p => p.id === id ? updatedPlayer : p)
    }));
    
    if (isFirebaseUser && user) savePlayer(user.uid, updatedPlayer, false);
  };

  const deletePlayerAction = (id: string) => {
    setState(s => ({ ...s, players: s.players.filter(p => p.id !== id) }));
    if (isFirebaseUser && user) deletePlayer(user.uid, id);
  };

  const togglePresence = (id: string) => {
    const playerIndex = state.players.findIndex(p => p.id === id);
    if (playerIndex === -1) return;
    const player = state.players[playerIndex];
    
    const currentPresent = state.players.filter(p => p.isPresent).length;
    if (!player.isPresent && currentPresent >= (state.maxPlayersPerTeam * state.numberOfTeams)) {
      alert('Limite de vagas atingido!');
      return;
    }
    
    const updatedPlayer = { ...player, isPresent: !player.isPresent };
    
    setState(s => ({
      ...s,
      players: s.players.map(p => p.id === id ? updatedPlayer : p)
    }));
    
    if (isFirebaseUser && user) savePlayer(user.uid, updatedPlayer, false);
  };

  const setPaymentStatus = (id: string, status: Player['paymentStatus']) => {
    updatePlayer(id, { paymentStatus: status });
  };

  const generateTeams = (balanced: boolean): Team[] => {
    const presentPlayers = state.players.filter(p => p.isPresent);
    
    let sortedPlayers = [...presentPlayers];
    
    if (balanced) {
      // Sort by rating descending
      sortedPlayers.sort((a, b) => b.rating - a.rating);
    } else {
      // Random shuffle
      sortedPlayers.sort(() => Math.random() - 0.5);
    }

    // Separate goalkeepers if needed, or just distribute them
    const goalkeepers = sortedPlayers.filter(p => p.isGoalkeeper);
    const fieldPlayers = sortedPlayers.filter(p => !p.isGoalkeeper);

    const teams: Team[] = Array.from({ length: state.numberOfTeams }, (_, i) => ({
      id: `team_${i + 1}`,
      name: `Time ${i + 1}`,
      players: [],
      score: 0,
    }));

    // Distribute goalkeepers first
    goalkeepers.forEach((gk, index) => {
      teams[index % state.numberOfTeams].players.push(gk);
    });

    // Distribute remaining players
    // If balanced, we do a snake draft pattern (1, 2, 2, 1) or simple distribution
    let direction = 1;
    let currentTeamIdx = goalkeepers.length % state.numberOfTeams;
    
    fieldPlayers.forEach(p => {
      teams[currentTeamIdx].players.push(p);
      if (balanced) {
        currentTeamIdx += direction;
        if (currentTeamIdx >= state.numberOfTeams || currentTeamIdx < 0) {
          direction *= -1;
          currentTeamIdx += direction;
        }
      } else {
        currentTeamIdx = (currentTeamIdx + 1) % state.numberOfTeams;
      }
    });

    return teams;
  };

  const startMatch = (teamA: Team, teamB: Team) => {
    const newMatch: Match = {
      id: Math.random().toString(36).substr(2, 9),
      teamA,
      teamB,
      status: 'in_progress',
      events: [],
      startTime: Date.now(),
    };
    setState(s => ({ ...s, matches: [...s.matches, newMatch] }));
    if (isFirebaseUser && user) saveMatch(user.uid, newMatch, true);
  };

  const updateMatchScore = (matchId: string, teamId: string, type: 'goal' | 'assist', playerId?: string) => {
    let updatedMatch: Match | undefined;
    
    // First, find the match to see if it exists
    const matchIndex = state.matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;

    const match = state.matches[matchIndex];
    const newEvent = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      playerId: playerId || '',
      teamId,
      timestamp: Date.now(),
    } as const;

    updatedMatch = {
      ...match,
      events: [...match.events, newEvent],
      teamA: {
        ...match.teamA,
        score: match.teamA.score + (teamId === match.teamA.id && type === 'goal' ? 1 : 0)
      },
      teamB: {
        ...match.teamB,
        score: match.teamB.score + (teamId === match.teamB.id && type === 'goal' ? 1 : 0)
      }
    };

    const newMatches = [...state.matches];
    newMatches[matchIndex] = updatedMatch;

    setState(s => ({ ...s, matches: newMatches }));
    
    if (isFirebaseUser && user && updatedMatch) saveMatch(user.uid, updatedMatch, false);
  };

  const finishMatch = (matchId: string) => {
    const matchIndex = state.matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;

    const match = state.matches[matchIndex];
    const updatedMatch: Match = { ...match, status: 'finished' as const };
    
    const newMatches = [...state.matches];
    newMatches[matchIndex] = updatedMatch;

    // Update player stats
    const newPlayers = [...state.players];
    const modifiedPlayers: Player[] = [];
    
    const updateStatsForTeam = (team: Team, isWinner: boolean, goalsConceded: number) => {
      team.players.forEach(p => {
        const playerIdx = newPlayers.findIndex(np => np.id === p.id);
        if (playerIdx > -1) {
          const playerEvents = updatedMatch.events.filter(e => e.playerId === p.id);
          const goals = playerEvents.filter(e => e.type === 'goal').length;
          const assists = playerEvents.filter(e => e.type === 'assist').length;
          
          newPlayers[playerIdx] = {
            ...newPlayers[playerIdx],
            stats: {
              ...newPlayers[playerIdx].stats,
              matchesPlayed: newPlayers[playerIdx].stats.matchesPlayed + 1,
              matchesWon: newPlayers[playerIdx].stats.matchesWon + (isWinner ? 1 : 0),
              goals: newPlayers[playerIdx].stats.goals + goals,
              assists: newPlayers[playerIdx].stats.assists + assists,
              goalsConceded: newPlayers[playerIdx].stats.goalsConceded + (p.isGoalkeeper ? goalsConceded : 0),
            }
          };
          modifiedPlayers.push(newPlayers[playerIdx]);
        }
      });
    };

    const teamAWon = match.teamA.score > match.teamB.score;
    const teamBWon = match.teamB.score > match.teamA.score;

    updateStatsForTeam(match.teamA, teamAWon, match.teamB.score);
    updateStatsForTeam(match.teamB, teamBWon, match.teamA.score);

    setState(s => ({ ...s, matches: newMatches, players: newPlayers }));
    
    if (isFirebaseUser && user) {
      saveMatch(user.uid, updatedMatch, false);
      modifiedPlayers.forEach(p => savePlayer(user.uid, p, false));
    }
  };

  const exportBackup = () => {
    return JSON.stringify(state, null, 2);
  };

  const restoreBackup = (jsonData: any) => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (!data || !Array.isArray(data.players)) {
        return false;
      }
      setState(s => ({
        ...s,
        ...data,
        players: data.players || s.players,
        matches: Array.isArray(data.matches) ? data.matches : s.matches,
      }));
      const { isConfigured } = getSupabaseConfig();
      if (isConfigured) {
        saveToSupabase(data);
      }
      return true;
    } catch (e) {
      console.error('Failed to restore backup:', e);
      return false;
    }
  };

  const syncSupabaseNow = async () => {
    return await saveToSupabase(state);
  };

  return (
    <AppContext.Provider value={{
      ...state,
      isAdmin,
      setIsAdmin,
      addPlayer,
      updatePlayer,
      deletePlayer: deletePlayerAction,
      togglePresence,
      setPaymentStatus,
      generateTeams,
      startMatch,
      updateMatchScore,
      finishMatch,
      setMaxPlayersPerTeam: (max) => {
        setState(s => ({ ...s, maxPlayersPerTeam: max }));
        if (isFirebaseUser && user) saveSettings(user.uid, { maxPlayersPerTeam: max }, false);
      },
      setNumberOfTeams: (num) => {
        setState(s => ({ ...s, numberOfTeams: num }));
        if (isFirebaseUser && user) saveSettings(user.uid, { numberOfTeams: num }, false);
      },
      setPixKey: (key) => {
        setState(s => ({ ...s, pixKey: key }));
        if (isFirebaseUser && user) saveSettings(user.uid, { pixKey: key }, false);
      },
      exportBackup,
      restoreBackup,
      syncSupabaseNow
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
