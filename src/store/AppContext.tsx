import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Player, Match, Team } from '../types';
import { useAuth } from './AuthContext';
import { 
  subscribeToPlayers, subscribeToMatches, subscribeToSettings, 
  savePlayer, deletePlayer, saveMatch, saveSettings, testConnection 
} from '../lib/db';
import { hashAdminPin, sanitizeText, sanitizePixKey, clampNumber, safeValidateBackup } from '../lib/security';

interface AppState {
  players: Player[];
  matches: Match[];
  maxPlayersPerTeam: number;
  numberOfTeams: number;
  pixKey: string;
  currentTeams: Team[];
  teamQueue: string[]; // Team IDs waiting in line
  benchPlayers: Player[]; // Confirmed players not in any active team
  matchDurationMinutes: number;
}

interface AppContextType extends AppState {
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  unlockAdmin: (pass: string) => Promise<boolean> | boolean;
  isDbConnected: boolean;
  isLoadedFromDb: boolean;
  syncWithDatabase: () => Promise<void>;
  addPlayer: (player: Omit<Player, 'id' | 'stats' | 'isPresent'>) => void;
  updatePlayer: (id: string, player: Partial<Player>) => void;
  deletePlayer: (id: string) => void;
  togglePresence: (id: string) => { success: boolean; message?: string };
  setPlayerPresence: (id: string, isPresent: boolean) => { success: boolean; message?: string };
  clearAllPresence: () => void;
  setPaymentStatus: (id: string, status: Player['paymentStatus']) => void;
  generateTeams: (balanced: boolean) => Team[];
  setGeneratedTeamsData: (teams: Team[], queue?: string[], bench?: Player[]) => void;
  startMatch: (teamA: Team, teamB: Team) => void;
  updateMatchScore: (matchId: string, teamId: string, type: 'goal' | 'assist', playerId?: string) => void;
  finishMatch: (matchId: string, customWinnerTeamId?: string) => { winnerTeam: Team | null; loserTeam: Team | null; isDraw: boolean };
  advanceToNextMatch: (advancingWinnerTeamId?: string) => { success: boolean; message: string; newMatch?: Match };
  markPlayerTiredOrInjured: (playerId: string, teamId: string, reason?: 'tired' | 'injured' | 'left') => {
    success: boolean;
    message: string;
    substitute?: Player;
  };
  returnPlayerToGame: (playerId: string, targetTeamId?: string) => {
    success: boolean;
    message: string;
  };
  autoBalanceTeams: () => { success: boolean; message: string };
  swapPlayersBetweenTeams: (playerAId: string, teamAId: string, playerBId: string, teamBId: string) => void;
  setMaxPlayersPerTeam: (max: number) => void;
  setNumberOfTeams: (num: number) => void;
  setMatchDurationMinutes: (mins: number) => void;
  setPixKey: (key: string) => void;
  adminPin: string;
  setAdminPin: (pin: string) => Promise<void>;
  exportBackup: () => string;
  restoreBackup: (jsonData: any) => boolean;
}

const initialDefaultPlayers: Player[] = [
  { id: 'p1', name: 'João Silva', type: 'mensalista', rating: 4, paymentStatus: 'pago', isGoalkeeper: false, isPresent: true, stats: { goals: 5, assists: 3, matchesWon: 2, matchesPlayed: 3, goalsConceded: 0 } },
  { id: 'p2', name: 'Carlos Henrique', type: 'mensalista', rating: 3, paymentStatus: 'pendente', isGoalkeeper: false, isPresent: true, stats: { goals: 2, assists: 1, matchesWon: 1, matchesPlayed: 3, goalsConceded: 0 } },
  { id: 'p3', name: 'Marcos Vinícius', type: 'mensalista', rating: 5, paymentStatus: 'atrasado', isGoalkeeper: false, isPresent: true, stats: { goals: 7, assists: 4, matchesWon: 3, matchesPlayed: 3, goalsConceded: 0 } },
  { id: 'p4', name: 'Lucas Goleiro', type: 'avulso', rating: 4, paymentStatus: 'pago', isGoalkeeper: true, isPresent: true, stats: { goals: 0, assists: 0, matchesWon: 2, matchesPlayed: 3, goalsConceded: 4 } },
  { id: 'p5', name: 'Pedro Santos', type: 'avulso', rating: 3, paymentStatus: 'pago', isGoalkeeper: false, isPresent: true, stats: { goals: 1, assists: 2, matchesWon: 2, matchesPlayed: 3, goalsConceded: 0 } },
  { id: 'p6', name: 'Gabriel Muralha', type: 'mensalista', rating: 5, paymentStatus: 'pago', isGoalkeeper: true, isPresent: true, stats: { goals: 0, assists: 1, matchesWon: 3, matchesPlayed: 3, goalsConceded: 3 } },
  { id: 'p7', name: 'Matheus Costa', type: 'mensalista', rating: 4, paymentStatus: 'pago', isGoalkeeper: false, isPresent: true, stats: { goals: 4, assists: 3, matchesWon: 2, matchesPlayed: 3, goalsConceded: 0 } },
  { id: 'p8', name: 'Rafael Souza', type: 'avulso', rating: 3, paymentStatus: 'pendente', isGoalkeeper: false, isPresent: true, stats: { goals: 2, assists: 0, matchesWon: 1, matchesPlayed: 2, goalsConceded: 0 } },
  { id: 'p9', name: 'Bruno Lima', type: 'mensalista', rating: 4, paymentStatus: 'pago', isGoalkeeper: false, isPresent: true, stats: { goals: 3, assists: 2, matchesWon: 2, matchesPlayed: 3, goalsConceded: 0 } },
  { id: 'p10', name: 'Felipe Rocha', type: 'avulso', rating: 3, paymentStatus: 'pago', isGoalkeeper: false, isPresent: true, stats: { goals: 1, assists: 1, matchesWon: 1, matchesPlayed: 2, goalsConceded: 0 } },
];

const defaultState: AppState = {
  players: [],
  matches: [],
  maxPlayersPerTeam: 5,
  numberOfTeams: 2,
  pixKey: '',
  currentTeams: [],
  teamQueue: [],
  benchPlayers: [],
  matchDurationMinutes: 10,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const currentUserId = user?.uid || 'grota_organizer';

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('pelada_fc_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.players) && parsed.players.length > 0) {
          return { ...defaultState, ...parsed };
        }
      } catch (e) {
        console.error('Failed to parse state from localStorage');
      }
    }
    return {
      ...defaultState,
      players: initialDefaultPlayers
    };
  });

  const [isAdmin, setIsAdminState] = useState(() => sessionStorage.getItem('admin_unlocked') === 'true');
  const [adminPinHash, setAdminPinHashState] = useState<string>(() => {
    return localStorage.getItem('pelada_admin_pin_hash') || '';
  });
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);
  const [isLoadedFromDb, setIsLoadedFromDb] = useState<boolean>(false);

  const setIsAdmin = (val: boolean) => {
    setIsAdminState(val);
    if (val) {
      sessionStorage.setItem('admin_unlocked', 'true');
    } else {
      sessionStorage.removeItem('admin_unlocked');
    }
  };

  const setAdminPin = async (newPin: string) => {
    const trimmed = newPin.trim();
    if (trimmed) {
      const hashed = await hashAdminPin(trimmed);
      setAdminPinHashState(hashed);
      localStorage.setItem('pelada_admin_pin_hash', hashed);
      localStorage.removeItem('pelada_admin_pin'); // Purge legacy plaintext PIN
    }
  };

  const unlockAdmin = async (pass: string): Promise<boolean> => {
    const trimmed = pass.trim();
    if (!trimmed) return false;

    const inputHash = await hashAdminPin(trimmed);

    // If hashed PIN is already set
    if (adminPinHash) {
      if (inputHash === adminPinHash) {
        setIsAdmin(true);
        return true;
      }
      return false;
    }

    // Default organizer PIN check
    const defaultHash = await hashAdminPin('162222');
    const legacyRaw = localStorage.getItem('pelada_admin_pin');
    
    if (inputHash === defaultHash || (legacyRaw && trimmed === legacyRaw)) {
      setAdminPinHashState(inputHash);
      localStorage.setItem('pelada_admin_pin_hash', inputHash);
      localStorage.removeItem('pelada_admin_pin');
      setIsAdmin(true);
      return true;
    }

    return false;
  };

  // Keep local storage as reliable fast-cache
  useEffect(() => {
    localStorage.setItem('pelada_fc_state', JSON.stringify(state));
  }, [state]);

  // Real-time synchronization with Cloud Firestore
  useEffect(() => {
    testConnection().then((online) => {
      setIsDbConnected(online);
    });

    // 1. Subscribe to Players
    const unsubPlayers = subscribeToPlayers(
      (firestorePlayers) => {
        setIsDbConnected(true);
        setIsLoadedFromDb(true);

        if (firestorePlayers.length > 0) {
          // Cloud Firestore has player documents - use them as master source
          setState(s => ({
            ...s,
            players: firestorePlayers
          }));
        } else {
          // Firestore collection is currently empty
          // Seed the current players from state or default initial players into Firestore
          setState(s => {
            const playersToSeed = s.players.length > 0 ? s.players : initialDefaultPlayers;
            playersToSeed.forEach(p => {
              savePlayer(currentUserId, p, true);
            });
            return {
              ...s,
              players: playersToSeed
            };
          });
        }
      },
      (error) => {
        console.warn('Firestore player sync note:', error);
        setIsDbConnected(false);
      }
    );

    // 2. Subscribe to Matches
    const unsubMatches = subscribeToMatches(
      (firestoreMatches) => {
        if (firestoreMatches.length > 0) {
          setState(s => ({ ...s, matches: firestoreMatches }));
        }
      },
      (error) => {
        console.warn('Firestore match sync note:', error);
      }
    );

    // 3. Subscribe to Settings
    const unsubSettings = subscribeToSettings(
      (settings) => {
        if (settings) {
          setState(s => ({
            ...s,
            pixKey: settings.pixKey ?? s.pixKey,
            maxPlayersPerTeam: settings.maxPlayersPerTeam ?? s.maxPlayersPerTeam,
            numberOfTeams: settings.numberOfTeams ?? s.numberOfTeams,
            matchDurationMinutes: settings.matchDurationMinutes ?? s.matchDurationMinutes,
            currentTeams: Array.isArray(settings.currentTeams) && settings.currentTeams.length > 0 
              ? settings.currentTeams 
              : s.currentTeams,
            teamQueue: Array.isArray(settings.teamQueue) ? settings.teamQueue : s.teamQueue,
            benchPlayers: Array.isArray(settings.benchPlayers) ? settings.benchPlayers : s.benchPlayers,
          }));
        }
      },
      (error) => {
        console.warn('Firestore settings sync note:', error);
      }
    );

    return () => {
      unsubPlayers();
      unsubMatches();
      unsubSettings();
    };
  }, [currentUserId]);

  // Force re-sync with Cloud Firestore
  const syncWithDatabase = useCallback(async () => {
    const isOnline = await testConnection();
    setIsDbConnected(isOnline);
    // Push current players to Firestore to guarantee persistence
    state.players.forEach(p => {
      savePlayer(currentUserId, p, false);
    });
    if (state.matches.length > 0) {
      state.matches.forEach(m => {
        saveMatch(currentUserId, m, false);
      });
    }
    saveSettings(currentUserId, {
      pixKey: state.pixKey,
      maxPlayersPerTeam: state.maxPlayersPerTeam,
      numberOfTeams: state.numberOfTeams,
      matchDurationMinutes: state.matchDurationMinutes,
      currentTeams: state.currentTeams,
      teamQueue: state.teamQueue,
      benchPlayers: state.benchPlayers,
    }, false);
  }, [state, currentUserId]);

  // Add player with sanitization and validation
  const addPlayer = (playerData: Omit<Player, 'id' | 'stats' | 'isPresent'>) => {
    const cleanId = 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const sanitizedName = sanitizeText(playerData.name, 60);
    const cleanRating = clampNumber(playerData.rating, 1, 5, 3);
    const newPlayer: Player = {
      ...playerData,
      name: sanitizedName || 'Jogador',
      rating: cleanRating,
      id: cleanId,
      isPresent: false,
      stats: { goals: 0, assists: 0, matchesWon: 0, matchesPlayed: 0, goalsConceded: 0 },
    };
    setState(s => ({ ...s, players: [...s.players, newPlayer] }));
    savePlayer(currentUserId, newPlayer, true);
  };

  // Update player with sanitized inputs
  const updatePlayer = (id: string, updates: Partial<Player>) => {
    const playerIndex = state.players.findIndex(p => p.id === id);
    if (playerIndex === -1) return;

    const safeUpdates: Partial<Player> = { ...updates };
    if (typeof safeUpdates.name === 'string') {
      safeUpdates.name = sanitizeText(safeUpdates.name, 60);
    }
    if (safeUpdates.rating !== undefined) {
      safeUpdates.rating = clampNumber(safeUpdates.rating, 1, 5, 3);
    }
    
    const updatedPlayer = { ...state.players[playerIndex], ...safeUpdates };
    
    setState(s => ({
      ...s,
      players: s.players.map(p => p.id === id ? updatedPlayer : p)
    }));
    
    savePlayer(currentUserId, updatedPlayer, false);
  };

  // Delete player permanently from database
  const deletePlayerAction = (id: string) => {
    setState(s => ({ ...s, players: s.players.filter(p => p.id !== id) }));
    deletePlayer(currentUserId, id);
  };

  // Toggle presence on match day
  const togglePresence = (id: string): { success: boolean; message?: string } => {
    const playerIndex = state.players.findIndex(p => p.id === id);
    if (playerIndex === -1) return { success: false, message: 'Jogador não encontrado' };
    const player = state.players[playerIndex];
    
    const currentPresent = state.players.filter(p => p.isPresent).length;
    if (!player.isPresent && currentPresent >= (state.maxPlayersPerTeam * state.numberOfTeams)) {
      return { success: false, message: 'Limite de vagas atingido! A lista de hoje já está cheia.' };
    }
    
    const updatedPlayer = { ...player, isPresent: !player.isPresent };
    
    setState(s => ({
      ...s,
      players: s.players.map(p => p.id === id ? updatedPlayer : p)
    }));
    
    savePlayer(currentUserId, updatedPlayer, false);
    return { success: true };
  };

  // Set explicit presence
  const setPlayerPresence = (id: string, isPresent: boolean): { success: boolean; message?: string } => {
    const playerIndex = state.players.findIndex(p => p.id === id);
    if (playerIndex === -1) return { success: false, message: 'Jogador não encontrado' };
    const player = state.players[playerIndex];
    
    if (player.isPresent === isPresent) return { success: true };

    const currentPresent = state.players.filter(p => p.isPresent).length;
    if (isPresent && currentPresent >= (state.maxPlayersPerTeam * state.numberOfTeams)) {
      return { success: false, message: 'Limite de vagas atingido! A lista de hoje já está cheia.' };
    }
    
    const updatedPlayer = { ...player, isPresent };
    
    setState(s => ({
      ...s,
      players: s.players.map(p => p.id === id ? updatedPlayer : p)
    }));
    
    savePlayer(currentUserId, updatedPlayer, false);
    return { success: true };
  };

  // Clear all presence (new match day)
  const clearAllPresence = () => {
    const updated = state.players.map(p => ({ ...p, isPresent: false }));
    setState(s => ({ ...s, players: updated }));
    updated.forEach(p => savePlayer(currentUserId, p, false));
  };

  const setPaymentStatus = (id: string, status: Player['paymentStatus']) => {
    updatePlayer(id, { paymentStatus: status });
  };

  const setGeneratedTeamsData = (teams: Team[], queue?: string[], bench?: Player[]) => {
    const finalQueue = queue ?? (teams.length > 2 ? teams.slice(2).map(t => t.id) : []);
    const finalBench = bench ?? [];
    setState(s => ({
      ...s,
      currentTeams: teams,
      teamQueue: finalQueue,
      benchPlayers: finalBench,
    }));
    saveSettings(currentUserId, {
      currentTeams: teams,
      teamQueue: finalQueue,
      benchPlayers: finalBench,
    }, false);
  };

  const generateTeams = (balanced: boolean): Team[] => {
    const availablePlayers = state.players.filter(p => p.isPresent && !p.isInjuredOrTired);
    
    let sortedPlayers = [...availablePlayers];
    
    if (balanced) {
      sortedPlayers.sort((a, b) => b.rating - a.rating);
    } else {
      sortedPlayers.sort(() => Math.random() - 0.5);
    }

    const goalkeepers = sortedPlayers.filter(p => p.isGoalkeeper);
    const fieldPlayers = sortedPlayers.filter(p => !p.isGoalkeeper);

    const teams: Team[] = Array.from({ length: state.numberOfTeams }, (_, i) => ({
      id: `team_${i + 1}`,
      name: `Time ${i + 1}`,
      players: [],
      score: 0,
      winsInRow: 0,
    }));

    // Distribute goalkeepers first
    goalkeepers.forEach((gk, index) => {
      teams[index % state.numberOfTeams].players.push(gk);
    });

    // Distribute remaining players up to max capacity
    const maxCapacity = state.maxPlayersPerTeam * state.numberOfTeams;
    const playersToAssign = fieldPlayers.slice(0, Math.max(0, maxCapacity - goalkeepers.length));
    const extraBenchPlayers = fieldPlayers.slice(Math.max(0, maxCapacity - goalkeepers.length));

    let direction = 1;
    let currentTeamIdx = goalkeepers.length % state.numberOfTeams;
    
    playersToAssign.forEach(p => {
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

    const queue = teams.length > 2 ? teams.slice(2).map(t => t.id) : [];

    setState(s => ({
      ...s,
      currentTeams: teams,
      teamQueue: queue,
      benchPlayers: extraBenchPlayers,
    }));

    saveSettings(currentUserId, {
      currentTeams: teams,
      teamQueue: queue,
      benchPlayers: extraBenchPlayers,
    }, false);

    return teams;
  };

  const startMatch = (teamA: Team, teamB: Team) => {
    const freshTeamA = state.currentTeams.find(t => t.id === teamA.id) || teamA;
    const freshTeamB = state.currentTeams.find(t => t.id === teamB.id) || teamB;

    const newMatch: Match = {
      id: 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      teamA: { ...freshTeamA, score: 0 },
      teamB: { ...freshTeamB, score: 0 },
      status: 'in_progress',
      events: [],
      matchNumber: state.matches.length + 1,
      startTime: Date.now(),
    };

    let queue = [...state.teamQueue];
    if (state.currentTeams.length > 2 && queue.length === 0) {
      queue = state.currentTeams
        .filter(t => t.id !== freshTeamA.id && t.id !== freshTeamB.id)
        .map(t => t.id);
    }

    setState(s => ({ ...s, matches: [...s.matches, newMatch], teamQueue: queue }));
    saveMatch(currentUserId, newMatch, true);
  };

  const updateMatchScore = (matchId: string, teamId: string, type: 'goal' | 'assist', playerId?: string) => {
    const matchIndex = state.matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;

    const match = state.matches[matchIndex];
    const newEvent = {
      id: 'ev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      type,
      playerId: playerId || '',
      teamId,
      timestamp: Date.now(),
    } as const;

    const updatedMatch: Match = {
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
    saveMatch(currentUserId, updatedMatch, false);
  };

  const finishMatch = (matchId: string, customWinnerTeamId?: string) => {
    const matchIndex = state.matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return { winnerTeam: null, loserTeam: null, isDraw: false };

    const match = state.matches[matchIndex];

    const teamAWon = match.teamA.score > match.teamB.score;
    const teamBWon = match.teamB.score > match.teamA.score;
    const isNaturalDraw = match.teamA.score === match.teamB.score;

    let winnerId: string | 'draw' = isNaturalDraw ? 'draw' : (teamAWon ? match.teamA.id : match.teamB.id);
    if (customWinnerTeamId) {
      winnerId = customWinnerTeamId;
    }

    const updatedMatch: Match = { 
      ...match, 
      status: 'finished' as const,
      winnerTeamId: winnerId,
      finishedAt: Date.now(),
    };
    
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

    const teamAWonFinal = winnerId === match.teamA.id;
    const teamBWonFinal = winnerId === match.teamB.id;

    updateStatsForTeam(match.teamA, teamAWonFinal, match.teamB.score);
    updateStatsForTeam(match.teamB, teamBWonFinal, match.teamA.score);

    // Update currentTeams winsInRow
    const newCurrentTeams = state.currentTeams.map(t => {
      if (t.id === winnerId) {
        return { ...t, winsInRow: (t.winsInRow || 0) + 1 };
      }
      if (t.id === match.teamA.id || t.id === match.teamB.id) {
        return { ...t, winsInRow: 0 };
      }
      return t;
    });

    setState(s => ({ 
      ...s, 
      matches: newMatches, 
      players: newPlayers,
      currentTeams: newCurrentTeams.length > 0 ? newCurrentTeams : s.currentTeams
    }));
    
    saveMatch(currentUserId, updatedMatch, false);
    modifiedPlayers.forEach(p => savePlayer(currentUserId, p, false));

    const winnerTeam = teamAWonFinal ? match.teamA : teamBWonFinal ? match.teamB : null;
    const loserTeam = teamAWonFinal ? match.teamB : teamBWonFinal ? match.teamA : null;

    return { winnerTeam, loserTeam, isDraw: isNaturalDraw && !customWinnerTeamId };
  };

  // Continuação das Partidas (Rei da Quadra)
  const advanceToNextMatch = (advancingWinnerTeamId?: string): { success: boolean; message: string; newMatch?: Match } => {
    const lastFinishedMatch = [...state.matches].reverse().find(m => m.status === 'finished');
    if (!lastFinishedMatch) {
      return { success: false, message: 'Nenhuma partida finalizada para dar sequência.' };
    }

    let stayingTeamId = advancingWinnerTeamId || lastFinishedMatch.winnerTeamId;
    if (!stayingTeamId || stayingTeamId === 'draw') {
      stayingTeamId = lastFinishedMatch.teamA.id;
    }

    const leavingTeamId = stayingTeamId === lastFinishedMatch.teamA.id 
      ? lastFinishedMatch.teamB.id 
      : lastFinishedMatch.teamA.id;

    let stayingTeam = state.currentTeams.find(t => t.id === stayingTeamId);
    let leavingTeam = state.currentTeams.find(t => t.id === leavingTeamId);

    if (!stayingTeam) {
      stayingTeam = stayingTeamId === lastFinishedMatch.teamA.id ? lastFinishedMatch.teamA : lastFinishedMatch.teamB;
    }
    if (!leavingTeam) {
      leavingTeam = leavingTeamId === lastFinishedMatch.teamA.id ? lastFinishedMatch.teamA : lastFinishedMatch.teamB;
    }

    let queue = [...state.teamQueue];
    if (queue.length === 0 && state.currentTeams.length > 2) {
      queue = state.currentTeams
        .filter(t => t.id !== stayingTeamId && t.id !== leavingTeamId)
        .map(t => t.id);
    }

    let nextChallengerTeam: Team;
    let newQueue: string[] = [];

    if (queue.length > 0) {
      const nextTeamId = queue[0];
      const foundChallenger = state.currentTeams.find(t => t.id === nextTeamId);
      nextChallengerTeam = foundChallenger || {
        id: nextTeamId,
        name: `Time ${nextTeamId.replace('team_', '')}`,
        players: [],
        score: 0,
      };
      newQueue = [...queue.slice(1), leavingTeam.id];
    } else {
      nextChallengerTeam = leavingTeam;
      newQueue = [];
    }

    const nextMatchNumber = (lastFinishedMatch.matchNumber || state.matches.length) + 1;
    const newMatch: Match = {
      id: 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      teamA: { ...stayingTeam, score: 0 },
      teamB: { ...nextChallengerTeam, score: 0 },
      status: 'in_progress',
      events: [],
      matchNumber: nextMatchNumber,
      startTime: Date.now(),
    };

    setState(s => ({
      ...s,
      matches: [...s.matches, newMatch],
      teamQueue: newQueue,
    }));

    saveMatch(currentUserId, newMatch, true);
    saveSettings(currentUserId, { teamQueue: newQueue }, false);

    return { 
      success: true, 
      message: `Próxima partida iniciada: ${stayingTeam.name} (Vencedor) x ${nextChallengerTeam.name} (Desafiante)!`,
      newMatch 
    };
  };

  // Ajuste Automático: Jogador Cansou / Machucou / Saiu
  const markPlayerTiredOrInjured = (
    playerId: string, 
    teamId: string, 
    reason: 'tired' | 'injured' | 'left' = 'tired'
  ): { success: boolean; message: string; substitute?: Player } => {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return { success: false, message: 'Jogador não encontrado.' };

    const targetTeam = state.currentTeams.find(t => t.id === teamId);
    if (!targetTeam) return { success: false, message: 'Time não encontrado.' };

    const updatedPlayers = state.players.map(p => {
      if (p.id === playerId) {
        return { 
          ...p, 
          isInjuredOrTired: true, 
          injuryReason: reason,
          isPresent: reason === 'left' ? false : p.isPresent
        };
      }
      return p;
    });

    let teamPlayers = targetTeam.players.filter(p => p.id !== playerId);
    let substitute: Player | undefined;
    let newBench = [...state.benchPlayers];
    let customMessage = '';

    // AUTO-ADJUSTMENT 1: Banco de Reservas
    if (newBench.length > 0) {
      let subIndex = -1;
      if (player.isGoalkeeper) {
        subIndex = newBench.findIndex(bp => bp.isGoalkeeper && !bp.isInjuredOrTired);
      }
      if (subIndex === -1) {
        let closestDiff = 999;
        newBench.forEach((bp, idx) => {
          if (!bp.isInjuredOrTired) {
            const diff = Math.abs(bp.rating - player.rating);
            if (diff < closestDiff) {
              closestDiff = diff;
              subIndex = idx;
            }
          }
        });
      }

      if (subIndex > -1) {
        substitute = newBench[subIndex];
        newBench.splice(subIndex, 1);
        teamPlayers.push(substitute);
        customMessage = `${player.name} saiu (${reason === 'injured' ? 'machucou' : reason === 'tired' ? 'cansou' : 'saiu'}). O reserva ${substitute.name} entrou automaticamente no ${targetTeam.name}!`;
      }
    }

    // AUTO-ADJUSTMENT 2: Reequilíbrio entre times
    let updatedTeams = state.currentTeams.map(t => {
      if (t.id === teamId) {
        return { ...t, players: teamPlayers };
      }
      return t;
    });

    if (!substitute && updatedTeams.length > 1) {
      const teamsWithExcess = updatedTeams
        .filter(t => t.id !== teamId && t.players.length > teamPlayers.length)
        .sort((a, b) => b.players.length - a.players.length);

      if (teamsWithExcess.length > 0 && (teamsWithExcess[0].players.length - teamPlayers.length) >= 2) {
        const donorTeam = teamsWithExcess[0];
        const nonGkDonors = donorTeam.players.filter(p => !p.isGoalkeeper);
        const playerToTransfer = (nonGkDonors.length > 0 ? nonGkDonors : donorTeam.players)[0];

        if (playerToTransfer) {
          substitute = playerToTransfer;
          updatedTeams = updatedTeams.map(t => {
            if (t.id === donorTeam.id) {
              return { ...t, players: t.players.filter(p => p.id !== playerToTransfer.id) };
            }
            if (t.id === teamId) {
              return { ...t, players: [...teamPlayers, playerToTransfer] };
            }
            return t;
          });
          customMessage = `${player.name} saiu (${reason === 'injured' ? 'machucou' : 'cansou'}). Para equilibrar os times, ${playerToTransfer.name} foi transferido(a) automaticamente do ${donorTeam.name} para o ${targetTeam.name}!`;
        }
      }
    }

    if (!customMessage) {
      const reasonLabel = reason === 'injured' ? 'machucou' : reason === 'tired' ? 'cansou' : 'saiu';
      customMessage = `${player.name} saiu (${reasonLabel}). O ${targetTeam.name} jogará com ${teamPlayers.length} atletas na próxima partida.`;
    }

    const updatedMatches = state.matches.map(m => {
      if (m.status === 'in_progress') {
        let tA = m.teamA;
        let tB = m.teamB;
        if (tA.id === teamId) {
          const fresh = updatedTeams.find(t => t.id === teamId);
          if (fresh) tA = { ...tA, players: fresh.players };
        }
        if (tB.id === teamId) {
          const fresh = updatedTeams.find(t => t.id === teamId);
          if (fresh) tB = { ...tB, players: fresh.players };
        }
        return { ...m, teamA: tA, teamB: tB };
      }
      return m;
    });

    setState(s => ({
      ...s,
      players: updatedPlayers,
      currentTeams: updatedTeams,
      benchPlayers: newBench,
      matches: updatedMatches,
    }));

    savePlayer(currentUserId, updatedPlayers.find(p => p.id === playerId)!, false);
    saveSettings(currentUserId, {
      currentTeams: updatedTeams,
      benchPlayers: newBench,
    }, false);

    return { success: true, message: customMessage, substitute };
  };

  // Retorno de jogador recuperado
  const returnPlayerToGame = (playerId: string, targetTeamId?: string): { success: boolean; message: string } => {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return { success: false, message: 'Jogador não encontrado.' };

    const updatedPlayers = state.players.map(p => {
      if (p.id === playerId) {
        return { ...p, isInjuredOrTired: false, injuryReason: undefined, isPresent: true };
      }
      return p;
    });

    let updatedTeams = [...state.currentTeams];
    let newBench = [...state.benchPlayers];
    let destMsg = '';

    if (targetTeamId) {
      const tIdx = updatedTeams.findIndex(t => t.id === targetTeamId);
      if (tIdx > -1) {
        updatedTeams[tIdx] = {
          ...updatedTeams[tIdx],
          players: [...updatedTeams[tIdx].players, { ...player, isInjuredOrTired: false, injuryReason: undefined }]
        };
        destMsg = `adicionado de volta ao ${updatedTeams[tIdx].name}!`;
      }
    } else {
      newBench.push({ ...player, isInjuredOrTired: false, injuryReason: undefined });
      destMsg = 'disponível no banco de reservas para a próxima partida!';
    }

    setState(s => ({
      ...s,
      players: updatedPlayers,
      currentTeams: updatedTeams,
      benchPlayers: newBench,
    }));

    savePlayer(currentUserId, updatedPlayers.find(p => p.id === playerId)!, false);

    return { success: true, message: `${player.name} está recuperado(a) e ${destMsg}` };
  };

  // Reequilíbrio Automático dos Times
  const autoBalanceTeams = (): { success: boolean; message: string } => {
    if (state.currentTeams.length < 2) {
      return { success: false, message: 'São necessários ao menos 2 times formados para equilibrar.' };
    }

    const allActive = state.currentTeams.flatMap(t => t.players).filter(p => !p.isInjuredOrTired);
    if (allActive.length === 0) {
      return { success: false, message: 'Nenhum jogador ativo para distribuir.' };
    }

    const sorted = [...allActive].sort((a, b) => b.rating - a.rating);
    const gks = sorted.filter(p => p.isGoalkeeper);
    const fields = sorted.filter(p => !p.isGoalkeeper);

    const numTeams = state.currentTeams.length;
    const newTeams: Team[] = state.currentTeams.map((t) => ({
      ...t,
      players: [],
    }));

    gks.forEach((gk, i) => {
      newTeams[i % numTeams].players.push(gk);
    });

    let direction = 1;
    let curr = gks.length % numTeams;
    fields.forEach(p => {
      newTeams[curr].players.push(p);
      curr += direction;
      if (curr >= numTeams || curr < 0) {
        direction *= -1;
        curr += direction;
      }
    });

    setState(s => ({ ...s, currentTeams: newTeams }));
    saveSettings(currentUserId, { currentTeams: newTeams }, false);

    return { success: true, message: `Times reequilibrados automaticamente com paridade numérica e de estrelas!` };
  };

  const swapPlayersBetweenTeams = (playerAId: string, teamAId: string, playerBId: string, teamBId: string) => {
    const teamA = state.currentTeams.find(t => t.id === teamAId);
    const teamB = state.currentTeams.find(t => t.id === teamBId);
    if (!teamA || !teamB) return;

    const pA = teamA.players.find(p => p.id === playerAId);
    const pB = teamB.players.find(p => p.id === playerBId);
    if (!pA || !pB) return;

    const newCurrentTeams = state.currentTeams.map(t => {
      if (t.id === teamAId) {
        return {
          ...t,
          players: t.players.map(p => p.id === playerAId ? pB : p)
        };
      }
      if (t.id === teamBId) {
        return {
          ...t,
          players: t.players.map(p => p.id === playerBId ? pA : p)
        };
      }
      return t;
    });

    setState(s => ({ ...s, currentTeams: newCurrentTeams }));
    saveSettings(currentUserId, { currentTeams: newCurrentTeams }, false);
  };

  const exportBackup = () => {
    return JSON.stringify(state, null, 2);
  };

  const restoreBackup = (jsonData: any) => {
    try {
      const validation = safeValidateBackup(jsonData);
      if (!validation.valid || !validation.data) {
        console.warn('Backup validation failed:', validation.error);
        return false;
      }
      const data = validation.data;
      setState(s => ({
        ...s,
        players: data.players,
        maxPlayersPerTeam: data.maxPlayersPerTeam,
        numberOfTeams: data.numberOfTeams,
        matchDurationMinutes: data.matchDurationMinutes,
        pixKey: data.pixKey,
      }));

      data.players.forEach((p: Player) => {
        savePlayer(currentUserId, p, false);
      });
      saveSettings(currentUserId, {
        maxPlayersPerTeam: data.maxPlayersPerTeam,
        numberOfTeams: data.numberOfTeams,
        matchDurationMinutes: data.matchDurationMinutes,
        pixKey: data.pixKey,
      }, false);
      return true;
    } catch (e) {
      console.error('Failed to restore backup:', e);
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      ...state,
      isAdmin,
      setIsAdmin,
      unlockAdmin,
      isDbConnected,
      isLoadedFromDb,
      syncWithDatabase,
      addPlayer,
      updatePlayer,
      deletePlayer: deletePlayerAction,
      togglePresence,
      setPlayerPresence,
      clearAllPresence,
      setPaymentStatus,
      generateTeams,
      setGeneratedTeamsData,
      startMatch,
      updateMatchScore,
      finishMatch,
      advanceToNextMatch,
      markPlayerTiredOrInjured,
      returnPlayerToGame,
      autoBalanceTeams,
      swapPlayersBetweenTeams,
      setMaxPlayersPerTeam: (max) => {
        const safe = clampNumber(max, 2, 20, 5);
        setState(s => ({ ...s, maxPlayersPerTeam: safe }));
        saveSettings(currentUserId, { maxPlayersPerTeam: safe }, false);
      },
      setNumberOfTeams: (num) => {
        const safe = clampNumber(num, 2, 8, 2);
        setState(s => ({ ...s, numberOfTeams: safe }));
        saveSettings(currentUserId, { numberOfTeams: safe }, false);
      },
      setMatchDurationMinutes: (mins) => {
        const safe = clampNumber(mins, 3, 60, 10);
        setState(s => ({ ...s, matchDurationMinutes: safe }));
        saveSettings(currentUserId, { matchDurationMinutes: safe }, false);
      },
      setPixKey: (key) => {
        const clean = sanitizePixKey(key, 80);
        setState(s => ({ ...s, pixKey: clean }));
        saveSettings(currentUserId, { pixKey: clean }, false);
      },
      adminPin: '********',
      setAdminPin,
      exportBackup,
      restoreBackup
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
