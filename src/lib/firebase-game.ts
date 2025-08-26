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
import { getUserProfile, updateUserStats } from './firebase-user';

// Type definitions
export interface GamePlayer {
  id: string;
  name: string;
  email: string;
  nickname?: string;
  avatar?: string;
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

export interface RoundResult {
  action: 'dudo' | 'calza';
  actionBy: string;
  bidder: string;
  winner: string;
  loser: string;
  actualCount: number;
  bidCount: number;
  bidValue: number;
  diceChange: { [playerId: string]: number }; // +1 for calza, -1 for loss
}

export interface GameState {
  players: { [playerId: string]: GamePlayer };
  currentPlayerId?: string;
  currentRound: number;
  phase: 'waiting' | 'rolling' | 'bidding_not_started' | 'bidding' | 'revealing' | 'round_complete';
  isPalifico: boolean;
  palificopPlayerEmail?: string; // Who triggered the current Palifico round
  palificoValueLock?: number; // The die value locked for this Palifico round
  previousDiceCounts?: { [playerEmail: string]: number }; // Track previous round dice counts
  currentWager?: GameWager;
  direction: 'up' | 'down';
  currentRoundDice: { [playerId: string]: number[] };
  roundStartedBy?: string; // Who started the current round
  roundStartTime?: Timestamp; // When the round started
  revealTime?: Timestamp; // When dice were revealed
  lastAction?: 'dudo' | 'calza'; // What ended the previous round
  lastActionBy?: string; // Who ended the previous round
  roundResults?: RoundResult; // Details of the round outcome
  revealedDice?: { [playerId: string]: number[] }; // Dice revealed after Dudo/Calza
  totalDicePerValue?: { [value: string]: number }; // Total count of each die value
  roundNumber: number; // Track which round we're in (for stats)
  roundStats: { // Track per-player stats for current round
    [playerId: string]: {
      diceRolled: number;
      dudoCalls: number;
      successfulDudos: number;
      calzaCalls: number;
      successfulCalzas: number;
    }
  };
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
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  maxPlayers: number;
  playerCount: number;
  players: string[]; // Array of player emails/uids
  playerOrder: string[]; // Canonical order of players for consistent display
  winner?: string;
  gameState?: GameState;
  settings: GameSettings;
}

// Helper function to create a secure game state for a specific player
// This ensures players only see their own dice until reveal phase
export const getSecureGameStateForPlayer = (
  game: Game,
  playerEmail: string
): Game => {
  if (!game.gameState) return game;
  
  const securePlayers: { [key: string]: GamePlayer } = {};
  
  // Copy all players but only include currentDice for the requesting player
  Object.keys(game.gameState!.players).forEach(email => {
    const player = { ...game.gameState!.players[email] };
    
    // Only include dice if:
    // 1. It's the requesting player's dice, OR
    // 2. We're in revealing/round_complete phase (all dice should be visible)
    if (email !== playerEmail && 
        game.gameState!.phase !== 'revealing' && 
        game.gameState!.phase !== 'round_complete') {
      player.currentDice = [];
    }
    
    securePlayers[email] = player;
  });
  
  // Create secure game state
  const secureGameState = {
    ...game.gameState,
    players: securePlayers,
    // Don't include currentRoundDice for other players
    currentRoundDice: game.gameState.phase === 'revealing' || game.gameState.phase === 'round_complete'
      ? game.gameState.currentRoundDice
      : { [playerEmail]: game.gameState.currentRoundDice?.[playerEmail] || [] }
  };
  
  return {
    ...game,
    gameState: secureGameState
  };
};

// Helper function to sort players by canonical order
export const sortPlayersByCanonicalOrder = (
  players: { [key: string]: GamePlayer },
  playerOrder: string[]
): GamePlayer[] => {
  if (!playerOrder || playerOrder.length === 0) {
    // Fallback to Object.values if no order exists (for backward compatibility)
    return Object.values(players);
  }
  
  // Sort players according to the canonical order
  const sortedPlayers: GamePlayer[] = [];
  for (const email of playerOrder) {
    if (players[email]) {
      sortedPlayers.push(players[email]);
    }
  }
  
  return sortedPlayers;
};

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
      playerOrder: [], // Initialize empty player order
      settings: {
        startingDice: 5,
        sevenDiceWins: true,
        sevenCalzasWins: true,
        palificoRules: true,
        ghostMode: true
      }
    };
    
    await addDoc(collection(db, 'games'), gameData);
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
  nickname?: string,
  uid?: string
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
    const updatedGameState: GameState = gameData.gameState || {
      players: {},
      currentRound: 0,
      phase: 'waiting' as const,
      isPalifico: false,
      direction: 'up' as const,
      currentRoundDice: {},
      roundNumber: 0,
      roundStats: {},
      previousDiceCounts: {}
    };
    
    // Fetch player's avatar from their profile
    let playerAvatar: string | undefined;
    if (uid) {
      try {
        const profile = await getUserProfile(uid);
        playerAvatar = profile?.avatar;
      } catch (error) {
        console.warn('Could not fetch player avatar:', error);
      }
    }
    
    // Add player to game state
    updatedGameState.players[playerEmail] = {
      id: uid || playerEmail,  // Use uid if available, else use email
      name: playerName,
      email: playerEmail,
      nickname: nickname || playerName,
      avatar: playerAvatar,
      diceCount: gameData.settings?.startingDice || 5,
      currentDice: [],
      calzaCount: 0,
      status: 'alive',
      isReady: false,
      isConnected: true,
      joinedAt: serverTimestamp() as Timestamp
    };
    
    // Update playerOrder array (initialize if doesn't exist for backward compatibility)
    const updatedPlayerOrder = gameData.playerOrder || [];
    if (!updatedPlayerOrder.includes(playerEmail)) {
      updatedPlayerOrder.push(playerEmail);
    }
    
    await updateDoc(gameRef, {
      players: [...gameData.players, playerEmail],
      playerOrder: updatedPlayerOrder,
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
    
    // If game is still in waiting status (lobby), remove the player completely
    if (gameData.status === 'waiting') {
      // Remove from players array
      gameData.players = gameData.players.filter(email => email !== playerEmail);
      gameData.playerCount = gameData.players.length;
      
      // Remove from playerOrder array
      const updatedPlayerOrder = (gameData.playerOrder || []).filter(email => email !== playerEmail);
      
      // Remove from gameState if exists
      if (gameData.gameState && gameData.gameState.players[playerEmail]) {
        delete gameData.gameState.players[playerEmail];
      }
      
      await updateDoc(gameRef, {
        players: gameData.players,
        playerOrder: updatedPlayerOrder,
        playerCount: gameData.playerCount,
        gameState: gameData.gameState,
        updatedAt: serverTimestamp()
      });
    } 
    // If game is active, just mark as disconnected (existing behavior)
    else if (gameData.status === 'active' && gameData.gameState && gameData.gameState.players[playerEmail]) {
      gameData.gameState.players[playerEmail].isConnected = false;
      
      const currentStatus = gameData.gameState.players[playerEmail].status;
      // Only mark as disconnected if they're alive
      if (currentStatus === 'alive') {
        gameData.gameState.players[playerEmail].status = 'disconnected';
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

// Transition from rolling to bidding_not_started phase
export const transitionFromRolling = async (gameId: string): Promise<void> => {
  try {
    const gameRef = doc(db, 'games', gameId);
    const gameDoc = await getDoc(gameRef);
    
    if (!gameDoc.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = gameDoc.data() as Game;
    
    if (gameData.gameState && gameData.gameState.phase === 'rolling') {
      gameData.gameState.phase = 'bidding_not_started';
      
      await updateDoc(gameRef, {
        gameState: gameData.gameState,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error transitioning from rolling:', error);
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
      // Use playerOrder for consistent ordering, filter for alive players
      const playerOrder = gameData.playerOrder || Object.keys(gameData.gameState.players);
      const alivePlayerEmails = playerOrder.filter(email => 
        gameData.gameState!.players[email] && 
        gameData.gameState!.players[email].status === 'alive'
      );
      const currentRoundDice: { [key: string]: number[] } = {};
      
      alivePlayerEmails.forEach(email => {
        const diceCount = gameData.gameState!.players[email].diceCount;
        const dice = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
        currentRoundDice[email] = dice;
        gameData.gameState!.players[email].currentDice = dice;
      });
      
      gameData.gameState.currentRoundDice = currentRoundDice;
      gameData.gameState.phase = 'rolling'; // Start with rolling phase
      gameData.gameState.currentRound = 1;
      gameData.gameState.currentPlayerId = alivePlayerEmails[0]; // First player in canonical order starts
      gameData.gameState.roundStartedBy = alivePlayerEmails[0];
      gameData.gameState.direction = 'down'; // Default direction
      gameData.gameState.roundStartTime = serverTimestamp() as Timestamp;
      // Initialize round tracking for stats
      gameData.gameState.roundNumber = 1;
      gameData.gameState.roundStats = {};
      // Initialize previous dice counts for Palifico tracking
      gameData.gameState.previousDiceCounts = {};
      alivePlayerEmails.forEach(email => {
        gameData.gameState!.previousDiceCounts![email] = gameData.gameState!.players[email].diceCount;
      });
      // Initialize round stats for each player with dice rolled
      alivePlayerEmails.forEach(email => {
        const diceCount = gameData.gameState!.players[email].diceCount;
        gameData.gameState!.roundStats[email] = {
          diceRolled: diceCount, // Track dice rolled this round
          dudoCalls: 0,
          successfulDudos: 0,
          calzaCalls: 0,
          successfulCalzas: 0
        };
      });
      // Don't set revealedDice and totalDicePerValue to undefined - Firebase doesn't like that
      // Instead, we'll delete them if they exist
      delete gameData.gameState.revealedDice;
      delete gameData.gameState.totalDicePerValue;
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

// Set direction for the round (only allowed before first bid)
export const setRoundDirection = async (
  gameId: string,
  playerEmail: string,
  direction: 'up' | 'down'
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
    
    if (gameData.gameState.phase !== 'bidding_not_started') {
      throw new Error('Can only change direction before bidding starts');
    }
    
    if (gameData.gameState.currentPlayerId !== playerEmail) {
      throw new Error('Only the current player can set direction');
    }
    
    gameData.gameState.direction = direction;
    
    await updateDoc(gameRef, {
      gameState: gameData.gameState,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error setting direction:', error);
    throw error;
  }
};

// Make a bid
export const makeBid = async (
  gameId: string,
  playerEmail: string,
  count: number,
  value: number,
  direction?: 'up' | 'down' // Optional direction for first bid
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
    
    // Count total dice for validation
    let totalDice = 0;
    Object.values(gameData.gameState.players).forEach(player => {
      if (player.status === 'alive' || player.status === 'disconnected') {
        totalDice += player.diceCount;
      }
    });
    
    // Validate count is within bounds
    if (count < 1 || count > totalDice) {
      throw new Error(`Count must be between 1 and ${totalDice}`);
    }
    
    // Check if this is the first bid of the round
    const isFirstBid = gameData.gameState.phase === 'bidding_not_started';
    
    if (isFirstBid) {
      // First bid of the round - set direction if provided
      if (direction) {
        gameData.gameState.direction = direction;
      }
      gameData.gameState.phase = 'bidding'; // Move to bidding phase
      
      // In Palifico rounds, lock the die value on first bid
      if (gameData.gameState.isPalifico) {
        gameData.gameState.palificoValueLock = value;
      }
    }
    
    // Validate bid against previous wager
    const currentWager = gameData.gameState.currentWager;
    if (currentWager) {
      const isPalifico = gameData.gameState.isPalifico;
      
      if (isPalifico) {
        // In Palifico, die value is locked - can only increase count
        const lockedValue = gameData.gameState.palificoValueLock || currentWager.value;
        
        if (value !== lockedValue) {
          throw new Error(`In Palifico rounds, you must bid on ${lockedValue}s only`);
        }
        if (count <= currentWager.count) {
          throw new Error('In Palifico rounds, you must increase the count');
        }
      } else {
        // Normal bidding rules - 1s are treated like any other number during bidding
        // Valid if: count is higher, OR (count is same AND value is higher)
        
        if (count < currentWager.count) {
          throw new Error('Invalid bid - count must be higher or equal');
        }
        if (count === currentWager.count && value <= currentWager.value) {
          throw new Error('Invalid bid - must increase value if count is the same');
        }
        // That's it! No special rules for 1s during bidding
      }
    }
    
    // Update wager and move to next player
    gameData.gameState.currentWager = {
      playerId: playerEmail,
      count,
      value
    };
    
    // Get next player using canonical order
    const playerOrder = gameData.playerOrder || Object.keys(gameData.gameState.players);
    const alivePlayers = playerOrder.filter(email => 
      gameData.gameState!.players[email] &&
      gameData.gameState!.players[email].status === 'alive' && 
      gameData.gameState!.players[email].isConnected
    );
    
    const currentIndex = alivePlayers.indexOf(playerEmail);
    // Direction: down = next in list (higher index), up = previous in list (lower index)
    const nextIndex = gameData.gameState.direction === 'down' 
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
    
    // Move to revealing phase
    gameData.gameState.phase = 'revealing';
    gameData.gameState.lastAction = 'dudo';
    gameData.gameState.lastActionBy = playerEmail;
    
    // Count actual dice and build totals
    const wager = gameData.gameState.currentWager;
    let actualCount = 0;
    const isPalifico = gameData.gameState.isPalifico;
    const totalDicePerValue: { [value: string]: number } = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 };
    const revealedDice: { [playerId: string]: number[] } = {};
    
    Object.keys(gameData.gameState.players).forEach(email => {
      const player = gameData.gameState!.players[email];
      if (player.status === 'alive' || player.status === 'disconnected') {
        // Store revealed dice
        revealedDice[email] = [...player.currentDice];
        
        // Count dice for totals
        player.currentDice.forEach(die => {
          totalDicePerValue[die.toString()]++;
          if (die === wager.value || (!isPalifico && die === 1 && wager.value !== 1)) {
            actualCount++;
          }
        });
      }
    });
    
    // Store revealed dice and totals
    gameData.gameState.revealedDice = revealedDice;
    gameData.gameState.totalDicePerValue = totalDicePerValue;
    gameData.gameState.revealTime = serverTimestamp() as Timestamp;
    
    // Determine winner/loser
    const bidderEmail = wager.playerId;
    const challengerEmail = playerEmail;
    let winnerEmail: string;
    let loserEmail: string;
    
    if (actualCount >= wager.count) {
      // Bid was correct, challenger loses
      winnerEmail = bidderEmail;
      loserEmail = challengerEmail;
    } else {
      // Bid was wrong, bidder loses
      winnerEmail = challengerEmail;
      loserEmail = bidderEmail;
    }
    
    // Update stats tracking - track the dudo call and its result
    if (!gameData.gameState.roundStats) {
      gameData.gameState.roundStats = {};
    }
    if (!gameData.gameState.roundStats[challengerEmail]) {
      gameData.gameState.roundStats[challengerEmail] = {
        diceRolled: 0,
        dudoCalls: 0,
        successfulDudos: 0,
        calzaCalls: 0,
        successfulCalzas: 0
      };
    }
    // Increment dudo calls for the challenger
    gameData.gameState.roundStats[challengerEmail].dudoCalls++;
    // Mark success if the challenger won (bidder was wrong)
    if (winnerEmail === challengerEmail) {
      gameData.gameState.roundStats[challengerEmail].successfulDudos++;
    }
    
    // Store round results
    gameData.gameState.roundResults = {
      action: 'dudo',
      actionBy: challengerEmail,
      bidder: bidderEmail,
      winner: winnerEmail,
      loser: loserEmail,
      actualCount,
      bidCount: wager.count,
      bidValue: wager.value,
      diceChange: { [loserEmail]: -1 }
    };
    
    // Don't change dice count yet - store it in roundResults for application next round
    // This allows players to see all dice during reveal phase
    
    // Keep phase as 'revealing' for now
    // Update database with reveal state
    await updateDoc(gameRef, {
      gameState: gameData.gameState,
      updatedAt: serverTimestamp()
    });
    
    // After 3 seconds, transition to round_complete
    setTimeout(async () => {
      const transitionDoc = await getDoc(gameRef);
      if (transitionDoc.exists()) {
        const transitionData = transitionDoc.data() as Game;
        if (transitionData.gameState?.phase === 'revealing') {
          transitionData.gameState.phase = 'round_complete';
          await updateDoc(gameRef, {
            gameState: transitionData.gameState,
            updatedAt: serverTimestamp()
          });
        }
      }
    }, 3000);
    
    // After 10 seconds total, start new round
    setTimeout(async () => {
      // Re-fetch the game data to get the latest state
      const freshGameDoc = await getDoc(gameRef);
      if (freshGameDoc.exists()) {
        const freshGameData = freshGameDoc.data() as Game;
        await startNewRound(gameRef, freshGameData, challengerEmail);  // Player who called dudo starts next
      }
    }, 10000);
    
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
    
    // Move to revealing phase
    gameData.gameState.phase = 'revealing';
    gameData.gameState.lastAction = 'calza';
    gameData.gameState.lastActionBy = playerEmail;
    
    // Count actual dice and build totals
    const wager = gameData.gameState.currentWager;
    let actualCount = 0;
    const isPalifico = gameData.gameState.isPalifico;
    const totalDicePerValue: { [value: string]: number } = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0 };
    const revealedDice: { [playerId: string]: number[] } = {};
    
    Object.keys(gameData.gameState.players).forEach(email => {
      const player = gameData.gameState!.players[email];
      if (player.status === 'alive' || player.status === 'disconnected') {
        // Store revealed dice
        revealedDice[email] = [...player.currentDice];
        
        // Count dice for totals
        player.currentDice.forEach(die => {
          totalDicePerValue[die.toString()]++;
          if (die === wager.value || (!isPalifico && die === 1 && wager.value !== 1)) {
            actualCount++;
          }
        });
      }
    });
    
    // Store revealed dice and totals
    gameData.gameState.revealedDice = revealedDice;
    gameData.gameState.totalDicePerValue = totalDicePerValue;
    gameData.gameState.revealTime = serverTimestamp() as Timestamp;
    
    // Check if exact and determine outcome
    const bidderEmail = wager.playerId;
    const callerEmail = playerEmail;
    let winnerEmail: string;
    let loserEmail: string | undefined;
    const diceChange: { [playerId: string]: number } = {};
    
    if (actualCount === wager.count) {
      // Calza successful! Store changes for next round
      const caller = gameData.gameState.players[playerEmail];
      const currentDiceCount = caller.diceCount;
      const newDiceCount = Math.min(6, currentDiceCount + 1);  // Max is always 6
      const newCalzaCount = (caller.calzaCount || 0) + 1;  // Always increment calza count
      
      winnerEmail = callerEmail;
      // Always store the dice change, even if at max (for calza count tracking)
      diceChange[callerEmail] = 1;
      
      // Check for win conditions (will be applied next round)
      if ((gameData.settings.sevenCalzasWins && newCalzaCount >= 7) ||
          (gameData.settings.sevenDiceWins && newDiceCount >= 7)) {
        // Game will be marked as won when dice changes are applied
        // Store this in round results
      }
    } else {
      // Calza failed, store dice loss for next round
      winnerEmail = bidderEmail;
      loserEmail = callerEmail;
      diceChange[callerEmail] = -1;
    }
    
    // Update stats tracking - track the calza call and its result
    if (!gameData.gameState.roundStats) {
      gameData.gameState.roundStats = {};
    }
    if (!gameData.gameState.roundStats[callerEmail]) {
      gameData.gameState.roundStats[callerEmail] = {
        diceRolled: 0,
        dudoCalls: 0,
        successfulDudos: 0,
        calzaCalls: 0,
        successfulCalzas: 0
      };
    }
    // Increment calza calls for the caller
    gameData.gameState.roundStats[callerEmail].calzaCalls++;
    // Mark success if the caller won (exact match)
    if (winnerEmail === callerEmail) {
      gameData.gameState.roundStats[callerEmail].successfulCalzas++;
    }
    
    // Store round results
    gameData.gameState.roundResults = {
      action: 'calza',
      actionBy: callerEmail,
      bidder: bidderEmail,
      winner: winnerEmail,
      loser: loserEmail || '',
      actualCount,
      bidCount: wager.count,
      bidValue: wager.value,
      diceChange
    };
    
    // Keep phase as 'revealing' for now
    // Update database with reveal state
    const updateData: {
      status: string;
      gameState: GameState;
      updatedAt: ReturnType<typeof serverTimestamp>;
      winner?: string;
    } = {
      status: gameData.status,
      gameState: gameData.gameState,
      updatedAt: serverTimestamp()
    };
    
    // Only include winner if game is completed
    if (gameData.winner) {
      updateData.winner = gameData.winner;
    }
    
    await updateDoc(gameRef, updateData);
    
    // After 3 seconds, transition to round_complete
    setTimeout(async () => {
      const transitionDoc = await getDoc(gameRef);
      if (transitionDoc.exists()) {
        const transitionData = transitionDoc.data() as Game;
        if (transitionData.gameState?.phase === 'revealing') {
          transitionData.gameState.phase = 'round_complete';
          await updateDoc(gameRef, {
            gameState: transitionData.gameState,
            updatedAt: serverTimestamp()
          });
        }
      }
    }, 3000);
    
    // After 10 seconds total, start new round or end game
    setTimeout(async () => {
      // Re-fetch the game data to get the latest state
      const freshGameDoc = await getDoc(gameRef);
      if (freshGameDoc.exists()) {
        const freshGameData = freshGameDoc.data() as Game;
        if (freshGameData.status !== 'completed') {
          await startNewRound(gameRef, freshGameData, playerEmail);  // Player who called calza starts next
        }
      }
    }, 10000);
    
  } catch (error) {
    console.error('Error calling calza:', error);
    throw error;
  }
};

// Helper function to update all player stats when game ends
const updateGameEndStats = async (
  gameData: Game,
  winnerId: string
): Promise<void> => {
  if (!gameData.gameState) return;
  
  try {
    // Get all players who participated in the game
    const players = gameData.gameState.players;
    const playerEmails = Object.keys(players);
    
    // Update stats for each player
    for (const playerEmail of playerEmails) {
      const player = players[playerEmail];
      
      // Aggregate stats from all rounds
      const roundStats = gameData.gameState.roundStats?.[playerEmail] || {
        diceRolled: 0,
        dudoCalls: 0,
        successfulDudos: 0,
        calzaCalls: 0,
        successfulCalzas: 0
      };
      
      // Get total rounds played (current round number)
      const roundsPlayed = gameData.gameState.roundNumber || 1;
      
      // Get total dice rolled (already accumulated in roundStats)
      const totalDiceRolled = roundStats.diceRolled || (gameData.settings.startingDice * roundsPlayed);
      
      // Update the player's stats in the database
      await updateUserStats(player.id, {
        won: playerEmail === winnerId,
        dudoCalls: roundStats.dudoCalls,
        successfulDudos: roundStats.successfulDudos,
        calzaCalls: roundStats.calzaCalls,
        successfulCalzas: roundStats.successfulCalzas,
        diceRolled: totalDiceRolled,
        roundsPlayed: roundsPlayed
      });
      
      console.log(`Updated stats for ${player.nickname || player.name}:`, {
        won: playerEmail === winnerId,
        dudoCalls: roundStats.dudoCalls,
        successfulDudos: roundStats.successfulDudos,
        calzaCalls: roundStats.calzaCalls,
        successfulCalzas: roundStats.successfulCalzas,
        diceRolled: totalDiceRolled,
        roundsPlayed: roundsPlayed
      });
    }
  } catch (error) {
    console.error('Error updating game end stats:', error);
    // Don't throw - we don't want stats errors to break the game
  }
};

// Helper function to start a new round
const startNewRound = async (
  gameRef: ReturnType<typeof doc>,
  gameData: Game,
  startingPlayerEmail: string
): Promise<void> => {
  if (!gameData.gameState) return;
  
  // Apply dice changes from the previous round if any
  if (gameData.gameState.roundResults) {
    const results = gameData.gameState.roundResults;
    
    // Apply dice changes
    for (const [playerEmail, change] of Object.entries(results.diceChange)) {
      const player = gameData.gameState.players[playerEmail];
      if (player) {
        if (change === -1) {
          // Lost a die
          player.diceCount = Math.max(0, player.diceCount - 1);
          if (player.diceCount === 0) {
            player.status = 'dead';
          }
        } else if (change === 1) {
          // Successful Calza
          const oldDiceCount = player.diceCount;
          player.diceCount = Math.min(6, player.diceCount + 1);  // Max is always 6
          player.calzaCount = (player.calzaCount || 0) + 1;  // Always increment calza count
          
          // Check for win conditions
          // Note: 7 dice wins means getting a 7th die from 6 (only via successful calza)
          // 7 calzas wins means getting 7 successful calzas total
          if (gameData.settings.sevenCalzasWins && player.calzaCount >= 7) {
            // Won by 7 calzas
            gameData.status = 'completed';
            gameData.winner = playerEmail;
          } else if (gameData.settings.sevenDiceWins && oldDiceCount === 6 && player.diceCount === 6) {
            // They already had 6 dice and got another calza - this counts as getting the "7th" die
            gameData.status = 'completed';
            gameData.winner = playerEmail;
          }
        }
      }
    }
  }
  
  // Check for game over using canonical order
  const playerOrder = gameData.playerOrder || Object.keys(gameData.gameState.players);
  const alivePlayers = playerOrder.filter(email => 
    gameData.gameState!.players[email] &&
    gameData.gameState!.players[email].status === 'alive'
  );
  
  if (alivePlayers.length === 1) {
    // Game over!
    gameData.status = 'completed';
    gameData.winner = alivePlayers[0];
  } else {
    // Roll new dice for all alive players
    const currentRoundDice: { [key: string]: number[] } = {};
    
    playerOrder.forEach(email => {
      if (gameData.gameState!.players[email]) {
        const player = gameData.gameState!.players[email];
        if (player.status === 'alive' && player.diceCount > 0) {
          const dice = Array.from({ length: player.diceCount }, () => Math.floor(Math.random() * 6) + 1);
          currentRoundDice[email] = dice;
          player.currentDice = dice;
        } else {
          player.currentDice = [];
        }
      }
    });
    
    // Check for Palifico (only if rules are enabled)
    let isPalifico = false;
    let palificopPlayerEmail: string | undefined;
    let nextStartingPlayer = startingPlayerEmail;
    
    if (gameData.settings?.palificoRules) {
      // Find players who just went down to 1 die (not already at 1)
      const previousDiceCounts = gameData.gameState.previousDiceCounts || {};
      
      for (const email of alivePlayers) {
        const currentDiceCount = gameData.gameState!.players[email].diceCount;
        const previousDiceCount = previousDiceCounts[email] || currentDiceCount;
        
        // Trigger Palifico if player went from >1 to exactly 1
        if (currentDiceCount === 1 && previousDiceCount > 1) {
          isPalifico = true;
          palificopPlayerEmail = email;
          nextStartingPlayer = email; // Palifico player starts the round
          break;
        }
      }
      
      // Update previous dice counts for next round
      alivePlayers.forEach(email => {
        if (!gameData.gameState!.previousDiceCounts) {
          gameData.gameState!.previousDiceCounts = {};
        }
        gameData.gameState!.previousDiceCounts[email] = gameData.gameState!.players[email].diceCount;
      });
    }
    
    // If not Palifico round, find next player in order
    if (!isPalifico) {
      const startingPlayerIndex = playerOrder.indexOf(startingPlayerEmail);
      
      // Find the next alive player after the one who ended the round
      for (let i = 1; i <= playerOrder.length; i++) {
        const nextIndex = (startingPlayerIndex + i) % playerOrder.length;
        const nextEmail = playerOrder[nextIndex];
        if (alivePlayers.includes(nextEmail)) {
          nextStartingPlayer = nextEmail;
          break;
        }
      }
    }
    
    // Reset for new round
    gameData.gameState.currentRoundDice = currentRoundDice;
    gameData.gameState.phase = 'rolling';  // Start with rolling phase
    gameData.gameState.currentRound++;
    delete gameData.gameState.currentWager;  // Remove instead of setting undefined
    delete gameData.gameState.palificoValueLock; // Clear value lock from previous Palifico round
    gameData.gameState.isPalifico = isPalifico;
    gameData.gameState.palificopPlayerEmail = palificopPlayerEmail;
    gameData.gameState.currentPlayerId = nextStartingPlayer;
    gameData.gameState.roundStartedBy = nextStartingPlayer;
    gameData.gameState.direction = 'down';  // Reset to default direction
    gameData.gameState.roundStartTime = serverTimestamp() as Timestamp;
    
    // Update round tracking for stats
    gameData.gameState.roundNumber = (gameData.gameState.roundNumber || 1) + 1;
    
    // Keep existing stats and add dice rolled for this new round
    const updatedRoundStats: typeof gameData.gameState.roundStats = gameData.gameState.roundStats || {};
    alivePlayers.forEach(email => {
      const player = gameData.gameState!.players[email];
      const existingStats = updatedRoundStats[email] || {
        diceRolled: 0,
        dudoCalls: 0,
        successfulDudos: 0,
        calzaCalls: 0,
        successfulCalzas: 0
      };
      
      // Accumulate dice rolled for this new round
      updatedRoundStats[email] = {
        ...existingStats,
        diceRolled: existingStats.diceRolled + player.diceCount
      };
    });
    gameData.gameState.roundStats = updatedRoundStats;
    
    // Delete these fields instead of setting to undefined
    delete gameData.gameState.revealedDice;
    delete gameData.gameState.totalDicePerValue;
    delete gameData.gameState.roundResults;
  }
  
  // Build update object conditionally
  const updateData: {
    status: string;
    gameState: GameState;
    updatedAt: ReturnType<typeof serverTimestamp>;
    winner?: string;
  } = {
    status: gameData.status,
    gameState: gameData.gameState,
    updatedAt: serverTimestamp()
  };
  
  // Only include winner if game is completed
  if (gameData.winner) {
    updateData.winner = gameData.winner;
    
    // Update all player stats when game ends
    await updateGameEndStats(gameData, gameData.winner);
  }
  
  await updateDoc(gameRef, updateData);
};

// Cancel a game (host only)
export const cancelGame = async (gameId: string, userEmail: string): Promise<void> => {
  try {
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);
    
    if (!gameSnap.exists()) {
      throw new Error('Game not found');
    }
    
    const gameData = gameSnap.data() as Game;
    
    // Check if user is the host
    if (gameData.hostEmail !== userEmail) {
      throw new Error('Only the host can cancel the game');
    }
    
    // Check if game is already completed or cancelled
    if (gameData.status === 'completed' || gameData.status === 'cancelled') {
      throw new Error('Game is already finished');
    }
    
    // Update game status to cancelled
    await updateDoc(gameRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });
    
    console.log('Game cancelled successfully');
  } catch (error) {
    console.error('Error cancelling game:', error);
    throw error;
  }
};