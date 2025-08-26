import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/auth-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GameBoard } from '@/components/ui/game-board';
import { Dice } from '@/components/ui/dice';
import { 
  subscribeToActiveGames,
  leaveGame as leaveGameInFirebase,
  reconnectToGame,
  makeBid,
  callDudo as callDudoInFirebase,
  callCalza as callCalzaInFirebase,
  callGhostCalza as callGhostCalzaInFirebase,
  cancelGame,
  sortPlayersByCanonicalOrder,
  setRoundDirection,
  transitionFromRolling,
  transitionToNewRound,
  getSecureGameStateForPlayer,
  type Game,
  type GamePlayer
} from '@/lib/firebase-game';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Dices,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Anchor,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  DiceRevealAnimation,
  VictoryAnnouncement 
} from '@/components/ui/game-animations';

interface GameState {
  currentBid: { count: number; value: number } | null;
  totalDice: number;
  isPalifico: boolean;
  roundDirection: 'up' | 'down';
  revealedDice?: { [playerId: string]: number[] };
  phase: 'waiting' | 'rolling' | 'bidding_not_started' | 'bidding' | 'revealing' | 'round_complete';
  roundResults?: {
    action: 'dudo' | 'calza';
    actionBy: string;
    bidder: string;
    winner: string;
    loser: string;
    actualCount: number;
    bidCount: number;
    bidValue: number;
    diceChange: { [playerId: string]: number };
  };
  totalDicePerValue?: { [value: string]: number };
}

const PerudoGame = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { user } = useAuth();
  
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationMessage, setCancellationMessage] = useState<string | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    currentBid: null,
    totalDice: 0,
    isPalifico: false,
    roundDirection: 'down',
    phase: 'waiting'
  });
  
  // Animation states
  const [showDudo, setShowDudo] = useState(false);
  const [showCalza, setShowCalza] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [showDiceReveal, setShowDiceReveal] = useState(false);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [dudoPlayerName, setDudoPlayerName] = useState('');
  const [calzaPlayerName, setCalzaPlayerName] = useState('');
  
  // Victory screen state
  const [showVictoryScreen, setShowVictoryScreen] = useState(false);
  const [gameWinner, setGameWinner] = useState<string | null>(null);
  const [winnerAvatar, setWinnerAvatar] = useState<string>('🏴‍☠️');
  const [winMethod, setWinMethod] = useState<'seven_dice' | 'seven_calzas' | 'last_standing'>('last_standing');

  const [selectedCount, setSelectedCount] = useState(1);
  const [selectedValue, setSelectedValue] = useState(1);
  const [myDice, setMyDice] = useState<number[]>([]);
  const [isRolling, setIsRolling] = useState(false);

  const roomCode = gameId?.toUpperCase() || '';
  const myPlayer = players.find(p => p.email === user?.email);
  const isDisconnected = myPlayer?.status === 'disconnected';
  const isHost = currentGame?.hostEmail === user?.email;

  // Subscribe to game updates
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = subscribeToActiveGames((games) => {
      const game = games.find(g => g.code === roomCode);
      if (game && user?.email) {
        // Apply secure game state filtering
        const secureGame = getSecureGameStateForPlayer(game, user.email);
        setCurrentGame(secureGame);
        
        // Extract players and game state, sorting by canonical order
        if (secureGame.gameState?.players) {
          const playerList = sortPlayersByCanonicalOrder(
            secureGame.gameState.players,
            secureGame.playerOrder || []
          );
          setPlayers(playerList);
          
          // Update total dice count
          const totalDice = playerList
            .filter(p => p.status === 'alive' || p.status === 'disconnected')
            .reduce((sum, p) => sum + p.diceCount, 0);
          
          setGameState(prev => ({
            ...prev,
            totalDice,
            isPalifico: secureGame.gameState?.isPalifico || false,
            currentBid: secureGame.gameState?.currentWager || null,
            phase: secureGame.gameState?.phase || 'waiting',
            roundDirection: secureGame.gameState?.direction || 'down',
            revealedDice: secureGame.gameState?.revealedDice,
            roundResults: secureGame.gameState?.roundResults,
            totalDicePerValue: secureGame.gameState?.totalDicePerValue
          }));
          
          // Set my dice if available
          const me = playerList.find(p => p.email === user?.email);
          if (me?.currentDice && me.currentDice.length > 0) {
            setMyDice(me.currentDice);
          }
          
          // Handle phase transitions and animations
          const phase = secureGame.gameState?.phase;
          const lastAction = secureGame.gameState?.lastAction;
          const lastActionBy = secureGame.gameState?.lastActionBy;
          
          console.log('[Phase Change] Current phase:', phase, 'lastAction:', lastAction);
          
          // Trigger animations based on phase  
          if (phase === 'revealing' && lastAction) {
            console.log('[Animation Trigger] Phase is revealing, will show animation!');
            console.log('[Animation States] dudo:', showDudo, 'calza:', showCalza);
            
            // Only trigger if we haven't already started any animation
            if (!showDudo && !showCalza && !showCountdown && !showDiceReveal && !showRoundResult) {
              // Show appropriate animation
              if (lastAction === 'dudo') {
                const player = playerList.find(p => p.email === lastActionBy);
                const name = player?.nickname || player?.name || 'Player';
                console.log('[DUDO] Triggering animation for:', name);
                setDudoPlayerName(name);
                setShowDudo(true);
              } else if (lastAction === 'calza') {
                const player = playerList.find(p => p.email === lastActionBy);
                const name = player?.nickname || player?.name || 'Player';
                console.log('[CALZA] Triggering animation for:', name);
                setCalzaPlayerName(name);
                setShowCalza(true);
              }
            } else {
              console.log('[Animation Skip] Already showing an animation');
            }
          } else if (phase === 'revealing' && !lastAction) {
            console.log('[Warning] Phase is revealing but no lastAction set!');
          }
          
          // Handle rolling phase transition
          if (phase === 'rolling' && secureGame.id) {
            setTimeout(() => {
              transitionFromRolling(secureGame.id!);
            }, 2000);
          }
          
          // Handle round complete phase transition (after animations finish)
          if (phase === 'round_complete' && secureGame.id) {
            console.log('[Round Transition] Phase is round_complete, starting new round after delay');
            setTimeout(() => {
              console.log('[Round Transition] Calling transitionToNewRound');
              transitionToNewRound(secureGame.id!);
            }, 10000); // Wait 10 seconds for animations to complete
          }
          
          // Start dice roll animation when phase changes to rolling
          if (phase === 'rolling' && !isRolling && myPlayer?.status === 'alive') {
            rollDice();
          }
          
          // Reset animation states when returning to rolling phase (new round)
          if (phase === 'rolling') {
            setShowDudo(false);
            setShowCalza(false);
            setShowCountdown(false);
            setShowDiceReveal(false);
            setShowRoundResult(false);
          }
        }
        
        // Handle game cancellation
        if (game.status === 'cancelled') {
          setCancellationMessage('Game was cancelled by the host');
          setTimeout(() => {
            navigate('/main-hub');
          }, 2000);
        }
        
        // Handle game completion (victory/defeat)
        if (game.status === 'completed' && game.winner && !showVictoryScreen) {
          setShowVictoryScreen(true);
          setGameWinner(game.winner);
          
          // Get winner's nickname and avatar
          const winnerPlayer = players.find(p => p.email === game.winner);
          if (winnerPlayer) {
            setWinnerAvatar(winnerPlayer.avatar || '🏴‍☠️');
            setGameWinner(winnerPlayer.nickname || winnerPlayer.name || game.winner);
          }
          
          // Set win method
          if (game.winMethod) {
            setWinMethod(game.winMethod);
          }
        }
      } else {
        // Game doesn't exist, go back to main hub
        navigate('/main-hub');
      }
    });

    return () => unsubscribe();
  }, [roomCode, navigate, user]);

  // Auto-reconnect if disconnected
  useEffect(() => {
    const handleReconnect = async () => {
      if (isDisconnected && currentGame?.id && user?.email && !isReconnecting) {
        setIsReconnecting(true);
        try {
          await reconnectToGame(currentGame.id, user.email);
        } catch (error) {
          console.error('Error reconnecting:', error);
        } finally {
          setIsReconnecting(false);
        }
      }
    };

    // Try to reconnect if disconnected
    if (isDisconnected) {
      handleReconnect();
    }
  }, [isDisconnected, currentGame, user, isReconnecting]);

  // Calculate expected values
  const calculateExpectedValues = () => {
    const totalDice = gameState.totalDice;
    const myTotalDice = myDice.length;
    const myOnes = myDice.filter(d => d === 1).length;
    const values = [];
    
    for (let i = 1; i <= 6; i++) {
      const myCountOfThisValue = myDice.filter(d => d === i).length;
      let baseExpected: number;
      let adjustedExpected: number;
      
      if (gameState.isPalifico) {
        // Palifico: all dice use same formula (1s are not wild)
        baseExpected = totalDice * (1/6);
        adjustedExpected = myCountOfThisValue + ((totalDice - myTotalDice) * (1/6));
      } else {
        // Non-Palifico: 1s are wild
        if (i === 1) {
          // For 1s specifically
          baseExpected = totalDice * (1/6);
          adjustedExpected = myOnes + ((totalDice - myTotalDice) * (1/6));
        } else {
          // For 2-6 (1s count as wild for these)
          baseExpected = totalDice * (1/3);
          adjustedExpected = myOnes + myCountOfThisValue + ((totalDice - myTotalDice) * (1/3));
        }
      }
      
      values.push({
        value: i,
        base: baseExpected.toFixed(1),
        adjusted: adjustedExpected.toFixed(1),
        actual: myCountOfThisValue
      });
    }
    
    return values;
  };

  const handleBid = async () => {
    if (!currentGame?.id || !user?.email) return;
    
    try {
      // If this is the first bid of the round, include the direction
      const isFirstBid = gameState.phase === 'bidding_not_started';
      await makeBid(
        currentGame.id, 
        user.email, 
        selectedCount, 
        selectedValue,
        isFirstBid ? gameState.roundDirection : undefined
      );
    } catch (error) {
      console.error('Error making bid:', error);
      // TODO: Show error toast
    }
  };
  
  const handleDirectionChange = async (direction: 'up' | 'down') => {
    if (!currentGame?.id || !user?.email) return;
    
    // Update local state immediately
    setGameState(prev => ({ ...prev, roundDirection: direction }));
    
    // Also update on server if we're in the right phase
    if (gameState.phase === 'bidding_not_started' && currentGame.gameState?.currentPlayerId === user.email) {
      try {
        await setRoundDirection(currentGame.id, user.email, direction);
      } catch (error) {
        console.error('Error setting direction:', error);
      }
    }
  };

  const handleDudo = async () => {
    if (!currentGame?.id || !user?.email) return;
    
    try {
      await callDudoInFirebase(currentGame.id, user.email);
      // Animation will be triggered by phase change
    } catch (error) {
      console.error('Error calling dudo:', error);
      // TODO: Show error toast
    }
  };

  const handleCalza = async () => {
    if (!currentGame?.id || !user?.email) return;
    
    try {
      // Check if player is a ghost
      const myPlayerStatus = currentGame?.gameState?.players[user.email]?.status;
      
      if (myPlayerStatus === 'ghost') {
        // Ghost Calza
        await callGhostCalzaInFirebase(currentGame.id, user.email);
      } else {
        // Regular Calza
        await callCalzaInFirebase(currentGame.id, user.email);
      }
      // Animation will be triggered by phase change
    } catch (error) {
      console.error('Error calling calza:', error);
      // TODO: Show error toast
    }
  };

  const handleLeaveGame = async () => {
    if (currentGame?.id && user?.email) {
      try {
        await leaveGameInFirebase(currentGame.id, user.email);
      } catch (error) {
        console.error('Error leaving game:', error);
      }
    }
    navigate('/main-hub');
  };
  
  const handleNavigateToHub = () => {
    navigate('/main-hub');
  };

  const handleCancelGame = async () => {
    if (!currentGame?.id || !user?.email || !isHost) return;
    
    setIsCancelling(true);
    try {
      await cancelGame(currentGame.id, user.email);
      // Navigation will happen automatically via subscription
    } catch (error) {
      console.error('Error cancelling game:', error);
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
    }
  };

  const rollDice = () => {
    // Roll dice with animation
    setIsRolling(true);
    
    // Generate new random dice values after animation completes
    setTimeout(() => {
      const diceCount = myPlayer?.diceCount || 5;
      const newDice = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
      setMyDice(newDice);
      // isRolling will be set to false by the onRollComplete callback
    }, 1800); // Match the dice animation duration
  };

  // Auto-roll dice at the start of each round
  useEffect(() => {
    // Don't clear dice during reveal - we want to keep showing them!
    // Only roll new dice when phase changes to rolling
    if (gameState.phase === 'rolling' && myPlayer?.status === 'alive' && !isRolling) {
      rollDice();
    }
  }, [gameState.phase, myPlayer?.status]);

  const expectedValues = calculateExpectedValues();
  
  // Determine which dice values are valid for bidding
  const getValidDiceValues = (): number[] => {
    if (!gameState.currentBid || gameState.phase !== 'bidding') {
      // No current bid or not in bidding phase
      if (gameState.isPalifico && gameState.phase === 'bidding_not_started') {
        // First bid of Palifico round - all values valid (will lock on selection)
        return [1, 2, 3, 4, 5, 6];
      }
      // Normal round first bid - all values valid
      return [1, 2, 3, 4, 5, 6];
    }
    
    const currentBid = gameState.currentBid;
    const validValues: number[] = [];
    
    if (gameState.isPalifico) {
      // Palifico rules: die value is locked after first bid
      const lockedValue = currentGame?.gameState?.palificoValueLock || currentBid.value;
      // Only the locked value is valid
      validValues.push(lockedValue);
    } else {
      // Normal rules - 1s are just like any other number during bidding
      if (selectedCount > currentBid.count) {
        // Higher count - all values valid
        return [1, 2, 3, 4, 5, 6];
      } else if (selectedCount === currentBid.count) {
        // Same count - need higher value
        for (let v = currentBid.value + 1; v <= 6; v++) {
          validValues.push(v);
        }
      } else {
        // Lower count - no values are valid
        return [];
      }
    }
    
    return validValues;
  };
  
  const validDiceValues = getValidDiceValues();
  
  // Get minimum valid count for a given value
  const getMinValidCount = (value: number): number => {
    if (!gameState.currentBid || gameState.phase !== 'bidding') {
      return 1;
    }
    
    const currentBid = gameState.currentBid;
    
    if (gameState.isPalifico) {
      // Palifico: only locked value allowed, must increase count
      const lockedValue = currentGame?.gameState?.palificoValueLock || currentBid.value;
      if (value === lockedValue) {
        return currentBid.count + 1;
      } else {
        // Other values are not valid in Palifico
        return 999; // Impossibly high count to prevent selection
      }
    } else {
      // Normal rules
      if (value > currentBid.value) {
        // Higher value - same count is ok
        return currentBid.count;
      } else if (value === currentBid.value) {
        // Same value - need higher count
        return currentBid.count + 1;
      } else {
        // Lower value - need higher count
        if (currentBid.value === 1 && value !== 1) {
          // Switching from 1s to non-1s
          return currentBid.count * 2 + 1;
        } else if (currentBid.value !== 1 && value === 1) {
          // Switching from non-1s to 1s
          return Math.floor(currentBid.count / 2) + 1;
        } else {
          // Regular lower value - need higher count
          return currentBid.count + 1;
        }
      }
    }
  };
  
  // Auto-adjust count when value changes to ensure valid bid
  useEffect(() => {
    if (gameState.currentBid && gameState.phase === 'bidding') {
      const minCount = getMinValidCount(selectedValue);
      if (selectedCount < minCount) {
        setSelectedCount(minCount);
      }
    }
  }, [selectedValue]); // Dependencies managed manually to avoid infinite loops
  
  // Set initial count to minimum valid when it becomes player's turn
  useEffect(() => {
    const currentPlayerId = currentGame?.gameState?.currentPlayerId;
    console.log('[Count Init] Phase:', gameState.phase, 'CurrentPlayer:', currentPlayerId, 'MyEmail:', myPlayer?.email);
    
    if (gameState.phase === 'bidding' && 
        currentPlayerId === myPlayer?.email &&
        gameState.currentBid) {
      
      const currentBidCount = gameState.currentBid.count;
      const currentBidValue = gameState.currentBid.value;
      const totalDice = gameState.totalDice;
      
      console.log('[Count Init] Current bid:', currentBidCount, 'x', currentBidValue);
      console.log('[Count Init] Total dice on board:', totalDice);
      
      // Logic: If current bid value is 5 or less, next valid bid can be same count but higher value
      // If current bid value is 6, must increase count
      let targetCount: number;
      
      if (currentBidValue < 6) {
        // Can bid at same count with higher value
        targetCount = currentBidCount;
        console.log('[Count Init] Bid value < 6, can use same count:', targetCount);
      } else {
        // Value is 6, must increase count
        targetCount = Math.min(currentBidCount + 1, totalDice);
        console.log('[Count Init] Bid value = 6, must increase count to:', targetCount);
      }
      
      console.log('[Count Init] Setting selected count to:', targetCount);
      setSelectedCount(targetCount);
    }
  }, [gameState.phase, currentGame?.gameState?.currentPlayerId, gameState.currentBid?.count, gameState.currentBid?.value]); // React to turn changes
  
  // Handle animation sequencing
  useEffect(() => {
    if (showDudo) {
      console.log('[Animation] Showing DUDO for 3 seconds');
      const timer = setTimeout(() => {
        console.log('[Animation] DUDO complete, showing countdown');
        setShowDudo(false);
        setShowCountdown(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showDudo]);
  
  useEffect(() => {
    if (showCalza) {
      console.log('[Animation] Showing CALZA for 3 seconds');
      const timer = setTimeout(() => {
        console.log('[Animation] CALZA complete, showing countdown');
        setShowCalza(false);
        setShowCountdown(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showCalza]);
  
  useEffect(() => {
    if (showCountdown) {
      console.log('[Animation] Starting countdown from 3');
      setCountdownNumber(3);
      
      // Count down from 3 to 1
      const timer1 = setTimeout(() => setCountdownNumber(2), 700);
      const timer2 = setTimeout(() => setCountdownNumber(1), 1400);
      const timer3 = setTimeout(() => {
        console.log('[Animation] Countdown complete, showing results');
        setShowCountdown(false);
        setShowRoundResult(true);
      }, 2100);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [showCountdown]);
  
  useEffect(() => {
    if (showRoundResult) {
      console.log('[Animation] Showing results for 8 seconds');
      const timer = setTimeout(() => {
        console.log('[Animation] Results complete, hiding');
        setShowRoundResult(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showRoundResult]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeaveGame}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              Leave
            </Button>
            {isHost && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="size-4" />
                <span className="hidden sm:inline">Cancel Game</span>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Anchor className="size-5 text-primary" />
            <span className="font-bold text-primary">Room {gameId}</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 max-w-6xl">
        {/* Game Board */}
        <div className="mb-4">
          <GameBoard
            players={players}
            currentPlayerId={currentGame?.gameState?.currentPlayerId || ''}
            currentUserEmail={user?.email || undefined}
            revealedDice={gameState.revealedDice}
          />
        </div>

        {/* Game Info - Combined Current Bid and Expected Values */}
        <Card className="mb-4">
          <CardContent className="pt-1 pb-2">
            <div className="text-base font-medium text-center mb-1">Game Info</div>
            <div className="grid grid-cols-12 gap-2">
              {/* Current Bid Section - Left Side */}
              <div className="col-span-5 border-r border-border/50 pr-2">
                {gameState.currentBid ? (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Current Bid:</div>
                    <div className="flex items-center gap-1 font-bold text-primary">
                      <span className="text-lg">{gameState.currentBid.count} ×</span>
                      <Dice value={gameState.currentBid.value as 1 | 2 | 3 | 4 | 5 | 6} size="sm" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      From: {(() => {
                        const bidPlayer = players.find(p => p.email === currentGame?.gameState?.currentWager?.playerId);
                        return bidPlayer?.nickname || bidPlayer?.name || 'Unknown';
                      })()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Next: {(() => {
                        const currentPlayer = players.find(p => p.email === currentGame?.gameState?.currentPlayerId);
                        return currentPlayer?.nickname || currentPlayer?.name || 'Unknown';
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="">
                    <div className="text-xs text-muted-foreground">
                      No bid yet
                      <br />
                      {currentGame?.gameState?.phase === 'rolling' ? 'Rolling dice...' : 'Starting soon...'}
                    </div>
                  </div>
                )}
                
                {/* Game Status Info */}
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Dices className="size-3" />
                    <span>{gameState.totalDice} on the board</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <span>Direction of play:</span>
                    {gameState.roundDirection === 'up' ? (
                      <ArrowUp className="size-3" />
                    ) : (
                      <ArrowDown className="size-3" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Expected Values Table - Right Side */}
              <div className="col-span-7 pl-1">
                <table className="w-full text-center">
                  <thead>
                    <tr>
                      <th className="text-[9px] text-left pr-1 font-normal text-muted-foreground w-10"></th>
                      {[1, 2, 3, 4, 5, 6].map((val) => (
                        <th key={val} className="pb-0.5">
                          <div className="flex justify-center">
                            <Dice value={val as 1 | 2 | 3 | 4 | 5 | 6} size="xs" />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Total row - always visible, shows dashes until reveal */}
                    <tr>
                      <td className="text-[10px] text-left pr-1 font-medium text-muted-foreground align-middle">Total</td>
                      {[1, 2, 3, 4, 5, 6].map((val) => {
                        // Use totalDicePerValue if available (calculated server-side)
                        if (gameState.totalDicePerValue) {
                          const totalCount = gameState.totalDicePerValue[val.toString()] || 0;
                          return (
                            <td key={val} className="text-base font-bold text-primary align-middle">
                              {totalCount}
                            </td>
                          );
                        }
                        // Fallback to revealedDice if available
                        else if (gameState.revealedDice) {
                          const totalCount = Object.values(gameState.revealedDice).reduce((sum, dice) => {
                            return sum + dice.filter(d => d === val).length;
                          }, 0);
                          return (
                            <td key={val} className="text-base font-bold text-primary align-middle">
                              {totalCount}
                            </td>
                          );
                        }
                        // Show dashes when not revealed
                        return (
                          <td key={val} className="text-base font-bold text-muted-foreground/40 align-middle">
                            -
                          </td>
                        );
                      })}
                    </tr>
                    
                    {/* Your Dice row */}
                    <tr>
                      <td className="text-[9px] text-left pr-1 text-muted-foreground align-middle">Your Dice</td>
                      {[1, 2, 3, 4, 5, 6].map((val) => {
                        const count = myDice.filter(d => d === val).length;
                        return (
                          <td key={val} className="text-[10px] text-muted-foreground align-middle">
                            {count || '-'}
                          </td>
                        );
                      })}
                    </tr>
                    
                    {/* Adjusted Expected Values row */}
                    <tr>
                      <td className="text-[9px] text-left pr-1 text-muted-foreground align-middle">adj exp</td>
                      {expectedValues.map((ev) => (
                        <td key={ev.value} className="text-[11px] font-medium text-accent align-middle">
                          {ev.adjusted}
                        </td>
                      ))}
                    </tr>
                    
                    {/* Base Expected Values row */}
                    <tr>
                      <td className="text-[9px] text-left pr-1 text-muted-foreground align-middle">base exp</td>
                      {expectedValues.map((ev) => (
                        <td key={ev.value} className="text-[10px] text-muted-foreground align-middle">
                          {ev.base}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
                {/* Palifico/Non-Palifico Round indicator - only show if Palifico rules enabled */}
                {currentGame?.settings?.palificoRules && (
                  <div className="mt-2 text-xs font-medium text-center">
                    {gameState.isPalifico ? (
                      <>
                        <span className="text-accent">Palifico Round</span>
                        {currentGame.gameState?.palificopPlayerEmail && (
                          <div className="text-xs text-muted-foreground">
                            triggered by {currentGame.gameState.players[currentGame.gameState.palificopPlayerEmail]?.nickname || 
                                         currentGame.gameState.players[currentGame.gameState.palificopPlayerEmail]?.name || 
                                         'a player'}
                          </div>
                        )}
                      </>
                    ) : (
                      'Non Palifico Round'
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Combined Your Dice + Controls */}
        <Card className="border-accent">
          <CardContent className="pt-1 pb-4">
            {/* Your Dice Section */}
            <div className="text-center">
              <div className="text-sm font-medium mb-2">Your Dice</div>
              <div className="flex justify-center gap-2 mb-3">
                {myDice.length > 0 ? (
                  myDice.map((die, index) => (
                    <Dice
                      key={index}
                      value={die as 1 | 2 | 3 | 4 | 5 | 6}
                      size="md"
                      isRolling={isRolling}
                      onRollComplete={() => {
                        if (isRolling && index === myDice.length - 1) {
                          setIsRolling(false);
                        }
                      }}
                    />
                  ))
                ) : (
                  // Show placeholder dice when no dice rolled yet
                  Array.from({ length: myPlayer?.diceCount || 5 }, (_, i) => (
                    <Dice
                      key={i}
                      value={1}
                      isHidden={true}
                      size="md"
                    />
                  ))
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50 my-3" />

            {/* Controls Section */}
            <div className="flex gap-2">
              {/* Direction Selector - 20% width */}
              <div className="w-[20%] flex flex-col">
                <label className="text-xs text-muted-foreground mb-1 text-center">Direction</label>
                <div className="flex flex-col items-center gap-2 flex-1 justify-center">
                  {/* Up Arrow Triangle */}
                  <button
                    onClick={() => handleDirectionChange('up')}
                    disabled={!(currentGame?.gameState?.currentPlayerId === myPlayer?.email && gameState.phase === 'bidding_not_started')}
                    className={cn(
                      "transition-all",
                      gameState.roundDirection === 'up' 
                        ? "text-accent" 
                        : "text-muted-foreground/50",
                      !(currentGame?.gameState?.currentPlayerId === myPlayer?.email && gameState.phase === 'bidding_not_started') && "opacity-30 cursor-not-allowed"
                    )}
                    aria-label="Direction Up"
                  >
                    <svg width="40" height="35" viewBox="0 0 40 35" fill="currentColor">
                      <path d="M20 2 L38 33 L2 33 Z" />
                    </svg>
                  </button>
                  {/* Down Arrow Triangle */}
                  <button
                    onClick={() => handleDirectionChange('down')}
                    disabled={!(currentGame?.gameState?.currentPlayerId === myPlayer?.email && gameState.phase === 'bidding_not_started')}
                    className={cn(
                      "transition-all",
                      gameState.roundDirection === 'down' 
                        ? "text-accent" 
                        : "text-muted-foreground/50",
                      !(currentGame?.gameState?.currentPlayerId === myPlayer?.email && gameState.phase === 'bidding_not_started') && "opacity-30 cursor-not-allowed"
                    )}
                    aria-label="Direction Down"
                  >
                    <svg width="40" height="35" viewBox="0 0 40 35" fill="currentColor">
                      <path d="M20 33 L2 2 L38 2 Z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Bid Controls Group - 40% width */}
              <div className="w-[40%] space-y-2">
                {/* Count and Value Group */}
                <div className="flex gap-2 items-start">
                  {/* Count Selector */}
                  <div className="flex flex-col items-center">
                    <label className="text-xs text-muted-foreground mb-1">Count</label>
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCount(Math.min(gameState.totalDice, selectedCount + 1))}
                        className="h-6 w-6 p-0 text-xs"
                      >
                        +
                      </Button>
                      <div className="text-center font-bold text-base h-6 flex items-center">
                        {selectedCount}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedCount(Math.max(1, selectedCount - 1))}
                        className="h-6 w-6 p-0 text-xs"
                      >
                        -
                      </Button>
                    </div>
                  </div>

                  {/* Value Selector - 2x3 Grid */}
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block text-center">Value</label>
                    <div className="grid grid-cols-3 gap-0.5">
                      {[1, 2, 3, 4, 5, 6].map((val) => {
                        const isValid = validDiceValues.includes(val);
                        const isMyTurn = currentGame?.gameState?.currentPlayerId === myPlayer?.email;
                        const canSelect = isValid && isMyTurn;
                        
                        return (
                          <button
                            key={val}
                            onClick={() => canSelect && setSelectedValue(val)}
                            disabled={!canSelect}
                            className={cn(
                              "p-0.5 rounded transition-all",
                              selectedValue === val && canSelect
                                ? "ring-2 ring-accent ring-offset-1 ring-offset-background" 
                                : canSelect
                                ? "hover:ring-1 hover:ring-accent/50"
                                : "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <Dice 
                              value={val as 1 | 2 | 3 | 4 | 5 | 6} 
                              size="xs" 
                              isHidden={!isValid}
                              className="pointer-events-none" 
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bid Button */}
                <Button
                  onClick={handleBid}
                  className="w-full bg-secondary hover:bg-secondary/90"
                  disabled={currentGame?.gameState?.currentPlayerId !== myPlayer?.email}
                >
                  Bid
                </Button>
              </div>

              {/* Dudo/Calza - 40% width with inner margin */}
              <div className="w-[40%] flex flex-col gap-2 pl-3">
                <Button
                  onClick={handleDudo}
                  variant="destructive"
                  className="flex-1 text-sm"
                  disabled={!gameState.currentBid || currentGame?.gameState?.currentPlayerId !== myPlayer?.email}
                >
                  Dudo!
                </Button>
                <Button
                  onClick={handleCalza}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground flex-1 text-sm"
                  disabled={(() => {
                    // No bid to Calza
                    if (!gameState.currentBid) return true;
                    
                    const myStatus = myPlayer?.status;
                    
                    // Dead players can't Calza
                    if (myStatus === 'dead') return true;
                    
                    // Ghosts can Calza during bidding phase
                    if (myStatus === 'ghost') {
                      return gameState.phase !== 'bidding';
                    }
                    
                    // Alive/zombie players: must be their turn and can't Calza own bid
                    return currentGame?.gameState?.currentPlayerId !== myPlayer?.email || 
                           currentGame?.gameState?.currentWager?.playerId === myPlayer?.email;
                  })()}
                >
                  Calza!
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Cancel Game Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Active Game?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Are you sure you want to cancel this active game?
            </p>
            <p className="mt-2 font-medium text-destructive">
              This will immediately end the game for all {players.length} players currently playing.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Playing
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelGame}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Game'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancellation Message */}
      {cancellationMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-destructive text-destructive-foreground px-6 py-3 rounded-lg shadow-lg">
            {cancellationMessage}
          </div>
        </div>
      )}
      
      {/* Game Animations */}
      {showDudo && (
        <div className="fixed inset-0 z-[99999] bg-black/90 flex flex-col items-center justify-center gap-4" style={{ zIndex: 99999 }}>
          <div className="bg-red-600 text-white text-6xl font-bold p-8 rounded-xl animate-bounce border-4 border-red-400">
            DUDO!
          </div>
          <div className="text-white text-3xl">
            {dudoPlayerName} doesn't believe the bid!
          </div>
          <div className="text-gray-300 text-xl mt-4">
            Revealing dice in 3 seconds...
          </div>
        </div>
      )}
      
      {/* Removed inline setTimeout - using useEffect instead */}
      
      {showCalza && (
        <div className="fixed inset-0 z-[99999] bg-black/90 flex flex-col items-center justify-center gap-4" style={{ zIndex: 99999 }}>
          <div className="bg-yellow-500 text-black text-6xl font-bold p-8 rounded-xl animate-bounce border-4 border-yellow-300">
            CALZA!
          </div>
          <div className="text-white text-3xl">
            {calzaPlayerName} calls it exactly!
          </div>
          <div className="text-gray-300 text-xl mt-4">
            Revealing dice in 3 seconds...
          </div>
        </div>
      )}
      
      {/* Removed inline setTimeout - using useEffect instead */}
      
      {showCountdown && (
        <div className="fixed inset-0 z-[99999] bg-black/90 flex flex-col items-center justify-center gap-4" style={{ zIndex: 99999 }}>
          <div className="text-white text-9xl font-bold animate-ping" key={countdownNumber}>
            {countdownNumber}
          </div>
          <div className="text-gray-300 text-2xl">
            Get ready for the reveal!
          </div>
        </div>
      )}
      
      {/* Removed inline setTimeout - using useEffect instead */}
      
      <DiceRevealAnimation 
        isVisible={showDiceReveal}
        players={players
          .filter(p => p.status === 'alive' || p.status === 'disconnected')
          .map((p, index) => ({
            playerId: p.email,
            playerName: p.nickname || p.name || p.email,
            dice: (gameState.revealedDice?.[p.email] || []).map(value => ({ 
              value: value as 1 | 2 | 3 | 4 | 5 | 6 
            })),
            position: { x: 0, y: index * 100 }
          }))}
        onComplete={() => {
          setShowDiceReveal(false);
          setShowRoundResult(true);
        }}
      />
      
      {/* Show round results clearly */}
      {showRoundResult && gameState.roundResults && (
        <div className="fixed inset-0 z-[99999] bg-black/90 flex flex-col items-center justify-center gap-4 p-4" style={{ zIndex: 99999 }}>
          <div className="bg-white text-black p-8 rounded-xl max-w-md text-center space-y-4">
            <div className="text-3xl font-bold">
              {gameState.roundResults.action === 'dudo' ? 'DUDO Result' : 'CALZA Result'}
            </div>
            
            <div className="text-xl">
              Bid was: {gameState.roundResults.bidCount} × {gameState.roundResults.bidValue}s
            </div>
            
            <div className="text-2xl font-semibold text-blue-600">
              Actual: {gameState.roundResults.actualCount} × {gameState.roundResults.bidValue}s
            </div>
            
            <div className="text-xl">
              {(() => {
                const rr = gameState.roundResults;
                if (rr.action === 'dudo') {
                  if (rr.actualCount >= rr.bidCount) {
                    return `✅ Bid was good! ${players.find(p => p.email === rr.loser)?.name || 'Challenger'} loses a die`;
                  } else {
                    return `❌ Dudo was right! ${players.find(p => p.email === rr.loser)?.name || 'Bidder'} loses a die`;
                  }
                } else {
                  if (rr.actualCount === rr.bidCount) {
                    return `🎯 Perfect Calza! ${players.find(p => p.email === rr.winner)?.name || 'Caller'} gains a die!`;
                  } else {
                    return `❌ Calza failed! ${players.find(p => p.email === rr.loser)?.name || 'Caller'} loses a die`;
                  }
                }
              })()}
            </div>
            
            <div className="text-sm text-gray-600 mt-4">
              Next round starting in a few seconds...
            </div>
          </div>
        </div>
      )}
      
      {/* Removed inline setTimeout - using useEffect instead */}
      
      {/* Victory Announcement */}
      <VictoryAnnouncement
        isVisible={showVictoryScreen}
        winner={gameWinner || ''}
        winnerAvatar={winnerAvatar}
        winMethod={winMethod}
        isWinner={currentGame?.winner === user?.email}
        onNavigateToHub={handleNavigateToHub}
        countdownSeconds={10}
      />
    </div>
  );
};

export default PerudoGame;