import { 
  collection, 
  addDoc, 
  doc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import type { DocumentData, QuerySnapshot } from 'firebase/firestore';
import { db } from '@/firebase/firebase';

// Type definitions
export interface GamePlayer {
  id: string;
  name: string;
  email: string;
  nickname?: string;
  diceCount: number;
  currentDice: number[];
  calzaCount: number;
  status: 'alive' | 'ghost' | 'zombie' | 'dead' | 'disconnected';
  isReady: boolean;
  isConnected: boolean;
  joinedAt: Timestamp;
}

export interface GameWager {
  playerId: string;
  count: number;
  value: number;
}

export interface GameState {
  players: { [playerId: string]: GamePlayer };
  currentPlayerId?: string;
  currentRound: number;
  phase: 'waiting' | 'rolling' | 'wagering' | 'revealing';
  isPalifico: boolean;
  palificopPlayerId?: string;
  currentWager?: GameWager;
  direction: 'up' | 'down';
  currentRoundDice: { [playerId: string]: number[] };
}

export interface GameSettings {
  startingDice: number;
  sevenDiceWins: boolean;
  sevenCalzasWins: boolean;
  palificoRules: boolean;
  ghostMode: boolean;
}

export interface Game {
  id?: string;
  code: string;
  name?: string;
  host: string;
  hostEmail: string;
  createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
  updatedAt: Timestamp | ReturnType<typeof serverTimestamp>;
  status: 'waiting' | 'active' | 'completed';
  maxPlayers: number;
  playerCount: number;
  players: string[]; // Array of player emails/uids
  winner?: string;
  gameState?: GameState;
  settings: GameSettings;
}

// Generate a unique 4-character room code
const generateRoomCode = async (): Promise<string> => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing characters
  let code = '';
  let attempts = 0;
  
  while (attempts < 10) {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Check if code already exists
    const gamesRef = collection(db, 'games');
    const q = query(gamesRef, where('code', '==', code), where('status', '!=', 'completed'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return code; // Code is unique
    }
    
    attempts++;
  }
  
  throw new Error('Could not generate unique room code');
};

// Create a new game
export const createGame = async (hostEmail: string, hostName: string): Promise<string> => {
  try {
    const roomCode = await generateRoomCode();
    
    const gameData: Omit<Game, 'id'> = {
      code: roomCode,
      host: hostName,
      hostEmail: hostEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'waiting',
      maxPlayers: 9,
      playerCount: 0,
      players: [],
      settings: {
        startingDice: 5,
        sevenDiceWins: true,
        sevenCalzasWins: true,
        palificoRules: true,
        ghostMode: true
      }
    };
    
    const docRef = await addDoc(collection(db, 'games'), gameData);
    return roomCode;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};

// Join a game (or rejoin if already a member)
export const joinGame = async (
  gameCode: string, 
  playerEmail: string, 
  playerName: string,
  nickname?: string
): Promise<{ joined: boolean; isActive: boolean }> => {
  try {
    // Find game by code (both waiting and active)
    const gamesRef = collection(db, 'games');
    const q = query(gamesRef, where('code', '==', gameCode.toUpperCase()), where('status', 'in', ['waiting', 'active']));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Game not found');
    }
    
    const gameDoc = querySnapshot.docs[0];
    const gameData = gameDoc.data() as Game;
    const gameRef = doc(db, 'games', gameDoc.id);
    
    // Check if already in game
    if (gameData.players.includes(playerEmail)) {
      // Player was already in the game
      if (gameData.status === 'active' && gameData.gameState?.players[playerEmail]) {
        // Rejoin active game - mark as reconnected
        await reconnectToGame(gameDoc.id, playerEmail);
        return { joined: true, isActive: true };
      }
      return { joined: true, isActive: gameData.status === 'active' };
    }
    
    // New player trying to join
    if (gameData.status === 'active') {
      throw new Error('Cannot join game in progress');
    }
    
    // Check if game is full
    if (gameData.playerCount >= gameData.maxPlayers) {
      throw new Error('Game is full');
    }
    
    // Initialize or update game state
    const updatedGameState = gameData.gameState || {
      players: {},
      currentRound: 0,
      phase: 'waiting',
      isPalifico: false,
      direction: 'up',
      currentRoundDice: {}
    };
    
    // Add player to game state
    updatedGameState.players[playerEmail] = {
      id: playerEmail,
      name: playerName,
      email: playerEmail,
      nickname: nickname || playerName,
      diceCount: gameData.settings?.startingDice || 5,
      currentDice: [],
      calzaCount: 0,
      status: 'alive',
      isReady: false,
      isConnected: true,
      joinedAt: serverTimestamp() as Timestamp
    };
    
    await updateDoc(gameRef, {
      players: [...gameData.players, playerEmail],
      playerCount: gameData.playerCount + 1,
      gameState: updatedGameState,
      updatedAt: serverTimestamp()
    });
    
    return { joined: true, isActive: false };
  } catch (error) {
    console.error('Error joining game:', error);
    throw error;
  }
};

// Get active games
export const subscribeToActiveGames = (
  callback: (games: Game[]) => void
): (() => void) => {
  const gamesRef = collection(db, 'games');
  const q = query(
    gamesRef, 
    where('status', 'in', ['waiting', 'active']),
    orderBy('createdAt', 'desc')
  );
  
  const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const games: Game[] = [];
    snapshot.forEach((doc) => {
      games.push({
        id: doc.id,
        ...doc.data()
      } as Game);
    });
    callback(games);
  }, (error) => {
    console.error('Error fetching games:', error);
  });
  
  return unsubscribe;
};

// Subscribe to a specific game
export const subscribeToGame = (
  gameId: string,
  callback: (game: Game | null) => void
): (() => void) => {
  const gameRef = doc(db, 'games', gameId);
  
  const unsubscribe = onSnapshot(gameRef, (doc) => {
    if (doc.exists()) {
      callback({
        id: doc.id,
        ...doc.data()
      } as Game);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error fetching game:', error);
    callback(null);
  });
  
  return unsubscribe;
};

// Update game settings
export const updateGameSettings = async (
  gameId: string,
  settings: GameSettings
): Promise<void> => {
  try {
    const gameRef = doc(db, 'games', gameId);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = gameDoc.data() as Game;
    
    // Update all existing players' dice counts if starting dice changed
    if (gameData.gameState && settings.startingDice !== gameData.settings?.startingDice) {
      Object.keys(gameData.gameState.players).forEach(email => {
        gameData.gameState!.players[email].diceCount = settings.startingDice;
      });
    }
    
    await updateDoc(gameRef, {
      settings,
      gameState: gameData.gameState,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating game settings:', error);
    throw error;
  }
};

// Update player ready status
export const updatePlayerReady = async (
  gameId: string,
  playerEmail: string,
  isReady: boolean
): Promise<void> => {
  try {
    const gameRef = doc(db, 'games', gameId);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = gameDoc.data() as Game;
    
    if (gameData.gameState && gameData.gameState.players[playerEmail]) {
      gameData.gameState.players[playerEmail].isReady = isReady;
      
      await updateDoc(gameRef, {
        gameState: gameData.gameState,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating ready status:', error);
    throw error;
  }
};

// Leave game (mark as disconnected)
export const leaveGame = async (
  gameId: string,
  playerEmail: string
): Promise<void> => {
  try {
    const gameRef = doc(db, 'games', gameId);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = gameDoc.data() as Game;
    
    if (gameData.gameState && gameData.gameState.players[playerEmail]) {
      // Mark player as disconnected
      gameData.gameState.players[playerEmail].isConnected = false;
      
      // If game is active, update their status to disconnected
      if (gameData.status === 'active') {
        const currentStatus = gameData.gameState.players[playerEmail].status;
        // Only mark as disconnected if they're alive
        if (currentStatus === 'alive') {
          gameData.gameState.players[playerEmail].status = 'disconnected';
        }
      }
      
      await updateDoc(gameRef, {
        gameState: gameData.gameState,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error leaving game:', error);
    throw error;
  }
};

// Reconnect to game
export const reconnectToGame = async (
  gameId: string,
  playerEmail: string
): Promise<void> => {
  try {
    const gameRef = doc(db, 'games', gameId);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = gameDoc.data() as Game;
    
    if (gameData.gameState && gameData.gameState.players[playerEmail]) {
      // Mark player as connected
      gameData.gameState.players[playerEmail].isConnected = true;
      
      // If they were disconnected, restore them to alive
      if (gameData.gameState.players[playerEmail].status === 'disconnected') {
        gameData.gameState.players[playerEmail].status = 'alive';
      }
      
      await updateDoc(gameRef, {
        gameState: gameData.gameState,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error reconnecting to game:', error);
    throw error;
  }
};

// Start game
export const startGame = async (gameId: string): Promise<void> => {
  try {
    const gameRef = doc(db, 'games', gameId);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = gameDoc.data() as Game;
    
    // Roll initial dice for all players
    if (gameData.gameState) {
      const playerEmails = Object.keys(gameData.gameState.players)
        .filter(email => gameData.gameState!.players[email].status === 'alive');
      const currentRoundDice: { [key: string]: number[] } = {};
      
      playerEmails.forEach(email => {
        const diceCount = gameData.gameState!.players[email].diceCount;
        const dice = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
        currentRoundDice[email] = dice;
        gameData.gameState!.players[email].currentDice = dice;
      });
      
      gameData.gameState.currentRoundDice = currentRoundDice;
      gameData.gameState.phase = 'wagering';
      gameData.gameState.currentRound = 1;
      gameData.gameState.currentPlayerId = playerEmails[0]; // First player starts
    }
    
    await updateDoc(gameRef, {
      status: 'active',
      gameState: gameData.gameState,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error starting game:', error);
    throw error;
  }
};

// Make a bid
export const makeBid = async (
  gameId: string,
  playerEmail: string,
  count: number,
  value: number
): Promise<void> => {
  try {
    const gameRef = doc(db, 'games', gameId);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = gameDoc.data() as Game;
    
    if (!gameData.gameState) {
      throw new Error('Game not started');
    }
    
    if (gameData.gameState.currentPlayerId !== playerEmail) {
      throw new Error('Not your turn');
    }
    
    // Validate bid
    const currentWager = gameData.gameState.currentWager;
    if (currentWager) {
      const isPalifico = gameData.gameState.isPalifico;
      
      if (isPalifico) {
        // In Palifico, can only increase count or value (not both)
        if (value !== currentWager.value && count !== currentWager.count) {
          throw new Error('In Palifico, you can only change count OR value');
        }
        if (value === currentWager.value && count <= currentWager.count) {
          throw new Error('Must increase count');
        }
        if (count === currentWager.count && value <= currentWager.value) {
          throw new Error('Must increase value');
        }
      } else {
        // Normal bidding: must increase count or value
        const currentTotal = currentWager.count * (currentWager.value === 1 ? 2 : 1);
        const newTotal = count * (value === 1 ? 2 : 1);
        
        if (newTotal <= currentTotal && !(count > currentWager.count && value >= currentWager.value)) {
          throw new Error('Invalid bid - must be higher');
        }
      }
    }
    
    // Update wager and move to next player
    gameData.gameState.currentWager = {
      playerId: playerEmail,
      count,
      value
    };
    
    // Get next player
    const alivePlayers = Object.keys(gameData.gameState.players)
      .filter(email => 
        gameData.gameState!.players[email].status === 'alive' && 
        gameData.gameState!.players[email].isConnected
      );
    
    const currentIndex = alivePlayers.indexOf(playerEmail);
    const nextIndex = gameData.gameState.direction === 'up' 
      ? (currentIndex + 1) % alivePlayers.length
      : (currentIndex - 1 + alivePlayers.length) % alivePlayers.length;
    
    gameData.gameState.currentPlayerId = alivePlayers[nextIndex];
    
    await updateDoc(gameRef, {
      gameState: gameData.gameState,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error making bid:', error);
    throw error;
  }
};

// Call dudo (challenge the bid)
export const callDudo = async (
  gameId: string,
  playerEmail: string
): Promise<void> => {
  try {
    const gameRef = doc(db, 'games', gameId);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = gameDoc.data() as Game;
    
    if (!gameData.gameState || !gameData.gameState.currentWager) {
      throw new Error('No wager to challenge');
    }
    
    if (gameData.gameState.currentPlayerId !== playerEmail) {
      throw new Error('Not your turn');
    }
    
    // Count actual dice
    const wager = gameData.gameState.currentWager;
    let actualCount = 0;
    const isPalifico = gameData.gameState.isPalifico;
    
    Object.keys(gameData.gameState.players).forEach(email => {
      const player = gameData.gameState!.players[email];
      if (player.status === 'alive' || player.status === 'disconnected') {
        player.currentDice.forEach(die => {
          if (die === wager.value || (!isPalifico && die === 1 && wager.value !== 1)) {
            actualCount++;
          }
        });
      }
    });
    
    // Determine winner/loser
    const bidderEmail = wager.playerId;
    const challengerEmail = playerEmail;
    let loserEmail: string;
    
    if (actualCount >= wager.count) {
      // Bid was correct, challenger loses
      loserEmail = challengerEmail;
    } else {
      // Bid was wrong, bidder loses
      loserEmail = bidderEmail;
    }
    
    // Remove a die from loser
    const loser = gameData.gameState.players[loserEmail];
    loser.diceCount = Math.max(0, loser.diceCount - 1);
    
    if (loser.diceCount === 0) {
      loser.status = 'dead';
    }
    
    // Start new round
    await startNewRound(gameRef, gameData, loserEmail);
    
  } catch (error) {
    console.error('Error calling dudo:', error);
    throw error;
  }
};

// Call calza (exact match)
export const callCalza = async (
  gameId: string,
  playerEmail: string
): Promise<void> => {
  try {
    const gameRef = doc(db, 'games', gameId);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = gameDoc.data() as Game;
    
    if (!gameData.gameState || !gameData.gameState.currentWager) {
      throw new Error('No wager to calza');
    }
    
    if (gameData.gameState.currentPlayerId !== playerEmail) {
      throw new Error('Not your turn');
    }
    
    if (gameData.gameState.currentWager.playerId === playerEmail) {
      throw new Error('Cannot calza your own bid');
    }
    
    // Count actual dice
    const wager = gameData.gameState.currentWager;
    let actualCount = 0;
    const isPalifico = gameData.gameState.isPalifico;
    
    Object.keys(gameData.gameState.players).forEach(email => {
      const player = gameData.gameState!.players[email];
      if (player.status === 'alive' || player.status === 'disconnected') {
        player.currentDice.forEach(die => {
          if (die === wager.value || (!isPalifico && die === 1 && wager.value !== 1)) {
            actualCount++;
          }
        });
      }
    });
    
    // Check if exact
    if (actualCount === wager.count) {
      // Calza successful! Caller gains a die (up to 5)
      const caller = gameData.gameState.players[playerEmail];
      caller.diceCount = Math.min(5, caller.diceCount + 1);
      caller.calzaCount = (caller.calzaCount || 0) + 1;
    } else {
      // Calza failed, caller loses a die
      const caller = gameData.gameState.players[playerEmail];
      caller.diceCount = Math.max(0, caller.diceCount - 1);
      
      if (caller.diceCount === 0) {
        caller.status = 'dead';
      }
    }
    
    // Start new round
    await startNewRound(gameRef, gameData, playerEmail);
    
  } catch (error) {
    console.error('Error calling calza:', error);
    throw error;
  }
};

// Helper function to start a new round
const startNewRound = async (
  gameRef: any,
  gameData: Game,
  startingPlayerEmail: string
): Promise<void> => {
  if (!gameData.gameState) return;
  
  // Check for game over
  const alivePlayers = Object.keys(gameData.gameState.players)
    .filter(email => gameData.gameState!.players[email].status === 'alive');
  
  if (alivePlayers.length === 1) {
    // Game over!
    gameData.status = 'completed';
    gameData.winner = alivePlayers[0];
  } else {
    // Roll new dice for all alive players
    const currentRoundDice: { [key: string]: number[] } = {};
    
    Object.keys(gameData.gameState.players).forEach(email => {
      const player = gameData.gameState!.players[email];
      if (player.status === 'alive' && player.diceCount > 0) {
        const dice = Array.from({ length: player.diceCount }, () => Math.floor(Math.random() * 6) + 1);
        currentRoundDice[email] = dice;
        player.currentDice = dice;
      } else {
        player.currentDice = [];
      }
    });
    
    // Check for Palifico (player with 1 die)
    const onePlayerWithOneDie = alivePlayers.filter(email => 
      gameData.gameState!.players[email].diceCount === 1
    ).length === 1;
    
    gameData.gameState.currentRoundDice = currentRoundDice;
    gameData.gameState.phase = 'wagering';
    gameData.gameState.currentRound++;
    gameData.gameState.currentWager = undefined;
    gameData.gameState.isPalifico = onePlayerWithOneDie;
    gameData.gameState.currentPlayerId = alivePlayers.includes(startingPlayerEmail) 
      ? startingPlayerEmail 
      : alivePlayers[0];
  }
  
  await updateDoc(gameRef, {
    status: gameData.status,
    winner: gameData.winner,
    gameState: gameData.gameState,
    updatedAt: serverTimestamp()
  });
};