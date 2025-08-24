import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp,
  increment,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';

// User profile interface
export interface UserProfile {
  uid: string;
  email: string;
  nickname: string;
  avatar: string; // Emoji character
  stats: UserStats;
  preferences: UserPreferences;
  createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
  updatedAt: Timestamp | ReturnType<typeof serverTimestamp>;
  lastActiveAt: Timestamp | ReturnType<typeof serverTimestamp>;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  totalDudoCalls: number;
  successfulDudos: number;
  totalCalzaCalls: number;
  successfulCalzas: number;
  currentWinStreak: number;
  longestWinStreak: number;
  lastWinDate: Timestamp | null;
  totalDiceRolled: number;
  totalRoundsPlayed: number;
}

export interface UserPreferences {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

// Available emoji avatars
export const AVAILABLE_AVATARS = [
  // Animals
  '🦊', '🐸', '🦁', '🐙', '🦜', '🦈', '🦉', '🐢', '🦄', '🐨',
  '🐼', '🐵', '🦝', '🐺', '🐯', '🦒', '🦘', '🦔', '🦚', '🦩',
  // Fun characters
  '👽', '🤖', '👻', '🎃', '☠️', '🤡', '👹', '👺', '🧙', '🧛',
  '🧟', '🧞', '🦸', '🦹', '🧚', '🧜', '🧝', '🎅', '🤶', '👸',
  // Objects & symbols
  '🎲', '⚓', '🎯', '🎪', '🎨', '🎭', '🎪', '🏴‍☠️', '🚀', '🛸',
  '⚡', '🔥', '💎', '🌟', '🎱', '🏆', '👑', '💀', '🌈', '🍀'
];

// Get or create user profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Initialize user profile on first signup
export const initializeUserProfile = async (
  uid: string, 
  email: string,
  nickname?: string
): Promise<UserProfile> => {
  try {
    // Generate default nickname from email if not provided
    const defaultNickname = nickname || email.split('@')[0];
    
    // Select random avatar
    const randomAvatar = AVAILABLE_AVATARS[Math.floor(Math.random() * AVAILABLE_AVATARS.length)];
    
    const newProfile: UserProfile = {
      uid,
      email,
      nickname: defaultNickname,
      avatar: randomAvatar,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalDudoCalls: 0,
        successfulDudos: 0,
        totalCalzaCalls: 0,
        successfulCalzas: 0,
        currentWinStreak: 0,
        longestWinStreak: 0,
        lastWinDate: null,
        totalDiceRolled: 0,
        totalRoundsPlayed: 0
      },
      preferences: {
        soundEnabled: true,
        notificationsEnabled: true,
        theme: 'system'
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp()
    };
    
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, newProfile);
    
    return newProfile;
  } catch (error) {
    console.error('Error initializing user profile:', error);
    throw error;
  }
};

// Update user profile (nickname, avatar, preferences)
export const updateUserProfile = async (
  uid: string,
  updates: Partial<Pick<UserProfile, 'nickname' | 'avatar' | 'preferences'>>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Update user activity timestamp
export const updateUserActivity = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      lastActiveAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user activity:', error);
  }
};

// Update stats after game completion
export const updateUserStats = async (
  uid: string,
  gameResult: {
    won: boolean;
    dudoCalls: number;
    successfulDudos: number;
    calzaCalls: number;
    successfulCalzas: number;
    diceRolled: number;
    roundsPlayed: number;
  }
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error('User profile not found');
      return;
    }
    
    const currentProfile = userSnap.data() as UserProfile;
    const currentStreak = currentProfile.stats.currentWinStreak;
    
    const updates: Record<string, unknown> = {
      'stats.gamesPlayed': increment(1),
      'stats.totalDudoCalls': increment(gameResult.dudoCalls),
      'stats.successfulDudos': increment(gameResult.successfulDudos),
      'stats.totalCalzaCalls': increment(gameResult.calzaCalls),
      'stats.successfulCalzas': increment(gameResult.successfulCalzas),
      'stats.totalDiceRolled': increment(gameResult.diceRolled),
      'stats.totalRoundsPlayed': increment(gameResult.roundsPlayed),
      updatedAt: serverTimestamp()
    };
    
    if (gameResult.won) {
      updates['stats.gamesWon'] = increment(1);
      updates['stats.currentWinStreak'] = currentStreak + 1;
      updates['stats.lastWinDate'] = serverTimestamp();
      
      // Update longest streak if needed
      if (currentStreak + 1 > currentProfile.stats.longestWinStreak) {
        updates['stats.longestWinStreak'] = currentStreak + 1;
      }
    } else {
      // Reset current streak on loss
      updates['stats.currentWinStreak'] = 0;
    }
    
    await updateDoc(userRef, updates as any);
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
};

// Get user's display info (nickname and avatar)
export const getUserDisplayInfo = async (uid: string): Promise<{ nickname: string; avatar: string } | null> => {
  try {
    const profile = await getUserProfile(uid);
    if (profile) {
      return {
        nickname: profile.nickname,
        avatar: profile.avatar
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user display info:', error);
    return null;
  }
};

// Calculate success rates
export const calculateSuccessRates = (stats: UserStats) => {
  const dudoRate = stats.totalDudoCalls > 0 
    ? Math.round((stats.successfulDudos / stats.totalDudoCalls) * 100) 
    : 0;
    
  const calzaRate = stats.totalCalzaCalls > 0 
    ? Math.round((stats.successfulCalzas / stats.totalCalzaCalls) * 100) 
    : 0;
    
  const winRate = stats.gamesPlayed > 0 
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
    : 0;
  
  return {
    dudoSuccessRate: dudoRate,
    calzaSuccessRate: calzaRate,
    winRate
  };
};

// Get top players by win count
export interface LeaderboardPlayer {
  nickname: string;
  avatar: string;
  gamesWon: number;
  gamesPlayed: number;
}

export const getTopPlayersByWins = async (topN: number = 3): Promise<LeaderboardPlayer[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      orderBy('stats.gamesWon', 'desc'),
      limit(topN)
    );
    
    const querySnapshot = await getDocs(q);
    const players: LeaderboardPlayer[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as UserProfile;
      // Only include players who have played at least one game
      if (data.stats.gamesPlayed > 0) {
        players.push({
          nickname: data.nickname,
          avatar: data.avatar,
          gamesWon: data.stats.gamesWon,
          gamesPlayed: data.stats.gamesPlayed
        });
      }
    });
    
    return players;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
};