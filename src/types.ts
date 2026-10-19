export type PlayerType = 'mensalista' | 'avulso';
export type PaymentStatus = 'pago' | 'pendente' | 'atrasado';

export interface PlayerStats {
  goals: number;
  assists: number;
  matchesWon: number;
  matchesPlayed: number;
  goalsConceded: number;
}

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  rating: number; // 1 to 5
  paymentStatus: PaymentStatus;
  isGoalkeeper: boolean;
  isPresent: boolean; // For the current match day
  stats: PlayerStats;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  score: number;
}

export type MatchEvent = 
  | { id: string; type: 'goal'; playerId: string; teamId: string; timestamp: number }
  | { id: string; type: 'assist'; playerId: string; teamId: string; timestamp: number }
  | { id: string; type: 'yellow_card'; playerId: string; teamId: string; timestamp: number };

export interface Match {
  id: string;
  teamA: Team;
  teamB: Team;
  status: 'not_started' | 'in_progress' | 'finished';
  events: MatchEvent[];
  startTime?: number;
}
