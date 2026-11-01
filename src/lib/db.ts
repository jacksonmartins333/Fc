import { 
  collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, serverTimestamp, getDocFromServer, writeBatch 
} from 'firebase/firestore';
import { db, auth } from './auth';
import { Match, Player } from '../types';

export enum OperationType {
  CREATE = 'create', UPDATE = 'update', DELETE = 'delete', LIST = 'list', GET = 'get', WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || 'guest_or_organizer',
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notification:', JSON.stringify(errInfo));
}

// Connection test as required by Firebase integration guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client operating offline or connecting...');
    }
    return false;
  }
}
testConnection();

// Subscribe to Players in Real Time
export function subscribeToPlayers(
  callback: (players: Player[]) => void, 
  onError?: (err: any) => void
) {
  const path = `shared/data/players`;
  const q = collection(db, path);
  return onSnapshot(
    q, 
    (snapshot) => {
      const players = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id,
          name: data.name || '',
          type: data.type || 'mensalista',
          rating: Number(data.rating) || 3,
          paymentStatus: data.paymentStatus || 'pendente',
          isGoalkeeper: Boolean(data.isGoalkeeper),
          isPresent: Boolean(data.isPresent),
          isInjuredOrTired: Boolean(data.isInjuredOrTired),
          injuryReason: data.injuryReason || undefined,
          stats: {
            goals: Number(data.stats?.goals) || 0,
            assists: Number(data.stats?.assists) || 0,
            matchesWon: Number(data.stats?.matchesWon) || 0,
            matchesPlayed: Number(data.stats?.matchesPlayed) || 0,
            goalsConceded: Number(data.stats?.goalsConceded) || 0,
          }
        } as Player;
      });
      callback(players);
    }, 
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

// Subscribe to Matches in Real Time
export function subscribeToMatches(
  callback: (matches: Match[]) => void,
  onError?: (err: any) => void
) {
  const path = `shared/data/matches`;
  const q = collection(db, path);
  return onSnapshot(
    q, 
    (snapshot) => {
      const matches = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data } as Match;
      });
      callback(matches);
    }, 
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      if (onError) onError(error);
    }
  );
}

// Subscribe to Global App Settings in Real Time
export function subscribeToSettings(
  callback: (settings: any) => void,
  onError?: (err: any) => void
) {
  const path = `shared/data/settings/app`;
  const q = doc(db, path);
  return onSnapshot(
    q, 
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      }
    }, 
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      if (onError) onError(error);
    }
  );
}

// Save Single Player
export async function savePlayer(userId: string, player: Player, isNew: boolean) {
  const path = `shared/data/players/${player.id}`;
  try {
    const { id, ...playerData } = player;
    const data: any = {
      ...playerData,
      ownerId: userId || 'organizer',
      updatedAt: serverTimestamp()
    };
    
    if (isNew) {
      data.createdAt = serverTimestamp();
    }
    
    await setDoc(doc(db, `shared/data/players`, player.id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete Player
export async function deletePlayer(userId: string, playerId: string) {
  const path = `shared/data/players/${playerId}`;
  try {
    await deleteDoc(doc(db, `shared/data/players`, playerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Save Match
export async function saveMatch(userId: string, match: Match, isNew: boolean) {
  const path = `shared/data/matches/${match.id}`;
  try {
    const { id, ...matchData } = match;
    const data: any = {
      ...matchData,
      ownerId: userId || 'organizer',
      updatedAt: serverTimestamp()
    };
    
    if (isNew) {
      data.createdAt = serverTimestamp();
    }
    
    await setDoc(doc(db, `shared/data/matches`, match.id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Save Settings
export async function saveSettings(userId: string, settings: any, isNew: boolean = false) {
  const path = `shared/data/settings/app`;
  try {
    const data: any = {
      ...settings,
      ownerId: userId || 'organizer',
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, path), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
