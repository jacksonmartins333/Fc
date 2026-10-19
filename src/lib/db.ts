import { 
  collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, query, where, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './auth';
import { Match, Player } from '../types';

enum OperationType {
  CREATE = 'create', UPDATE = 'update', DELETE = 'delete', LIST = 'list', GET = 'get', WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Subscribe to Players
export function subscribeToPlayers(userId: string, callback: (players: Player[]) => void) {
  const path = `shared/data/players`;
  const q = collection(db, path);
  return onSnapshot(q, (snapshot) => {
    const players = snapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data } as Player;
    });
    callback(players);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

// Subscribe to Matches
export function subscribeToMatches(userId: string, callback: (matches: Match[]) => void) {
  const path = `shared/data/matches`;
  const q = collection(db, path);
  return onSnapshot(q, (snapshot) => {
    const matches = snapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data } as Match;
    });
    callback(matches);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

// Subscribe to Settings
export function subscribeToSettings(userId: string, callback: (settings: any) => void) {
  const path = `shared/data/settings/app`;
  const q = doc(db, path);
  return onSnapshot(q, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, path);
  });
}

export async function savePlayer(userId: string, player: Player, isNew: boolean) {
  const path = `shared/data/players/${player.id}`;
  try {
    const { id, ...playerData } = player;
    const data: any = {
      ...playerData,
      ownerId: userId,
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

export async function deletePlayer(userId: string, playerId: string) {
  const path = `shared/data/players/${playerId}`;
  try {
    await deleteDoc(doc(db, `shared/data/players`, playerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveMatch(userId: string, match: Match, isNew: boolean) {
  const path = `shared/data/matches/${match.id}`;
  try {
    const { id, ...matchData } = match;
    const data: any = {
      ...matchData,
      ownerId: userId,
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

export async function saveSettings(userId: string, settings: any, isNew: boolean) {
  const path = `shared/data/settings/app`;
  try {
    const data: any = {
      ...settings,
      ownerId: userId,
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, path), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
