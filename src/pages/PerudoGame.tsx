import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/auth-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameBoard } from '@/components/ui/game-board';
import { Dice } from '@/components/ui/dice';
import { 
  subscribeToActiveGames,
  leaveGame as leaveGameInFirebase,
  reconnectToGame,
  makeBid,
  callDudo as callDudoInFirebase,
  callCalza as callCalzaInFirebase,
  cancelGame,
  type Game,
  type GamePlayer
} from '@/lib/firebase-game';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Dices,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  ArrowLeft,
  Anchor,
  X
} from 'lucide-react';

interface GameState {
  currentBid: { count: number; value: number } | null;
  totalDice: number;
  isPalifico: boolean;
  roundDirection: 'up' | 'down';
  revealedDice?: { [playerId: string]: number[] };
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
    roundDirection: 'up'
  });

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
      if (game) {
        setCurrentGame(game);
        
        // Extract players and game state
        if (game.gameState?.players) {
          const playerList = Object.values(game.gameState.players);
          setPlayers(playerList);
          
          // Update total dice count
          const totalDice = playerList
            .filter(p => p.status === 'alive' || p.status === 'disconnected')
            .reduce((sum, p) => sum + p.diceCount, 0);
          
          setGameState(prev => ({
            ...prev,
            totalDice,
            isPalifico: game.gameState?.isPalifico || false,
            currentBid: game.gameState?.currentWager || null
          }));
          
          // Set my dice if available
          const me = playerList.find(p => p.email === user?.email);
          if (me?.currentDice && me.currentDice.length > 0) {
            setMyDice(me.currentDice);
          }
        }
        
        // Handle game cancellation
        if (game.status === 'cancelled') {
          setCancellationMessage('Game was cancelled by the host');
          setTimeout(() => {
            navigate('/main-hub');
          }, 2000);
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
    const base = gameState.totalDice / (gameState.isPalifico ? 6 : 3);
    const values = [];
    
    for (let i = 1; i <= 6; i++) {
      const myCount = myDice.filter(d => d === i || (!gameState.isPalifico && d === 1)).length;
      const expected = gameState.isPalifico ? base : (i === 1 ? base : base * 2);
      const adjusted = expected - (myCount / gameState.totalDice * expected) + myCount;
      
      values.push({
        value: i,
        base: expected.toFixed(1),
        adjusted: adjusted.toFixed(1),
        actual: myCount
      });
    }
    
    return values;
  };

  const handleBid = async () => {
    if (!currentGame?.id || !user?.email) return;
    
    try {
      await makeBid(currentGame.id, user.email, selectedCount, selectedValue);
    } catch (error) {
      console.error('Error making bid:', error);
      // TODO: Show error toast
    }
  };

  const handleDudo = async () => {
    if (!currentGame?.id || !user?.email) return;
    
    try {
      await callDudoInFirebase(currentGame.id, user.email);
    } catch (error) {
      console.error('Error calling dudo:', error);
      // TODO: Show error toast
    }
  };

  const handleCalza = async () => {
    if (!currentGame?.id || !user?.email) return;
    
    try {
      await callCalzaInFirebase(currentGame.id, user.email);
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

  const expectedValues = calculateExpectedValues();

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
            currentPlayerId={currentGame?.gameState?.currentPlayerId}
            currentUserEmail={user?.email || undefined}
            revealedDice={gameState.revealedDice}
          />
        </div>

        {/* Game Info - Combined Current Bid and Expected Values */}
        <Card className="mb-4">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Game Info</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
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
                        const bidPlayer = players.find(p => p.id === currentGame?.gameState?.currentWager?.playerId);
                        return bidPlayer?.nickname || bidPlayer?.name || 'Unknown';
                      })()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Next: {(() => {
                        const currentPlayerIndex = players.findIndex(p => p.id === currentGame?.gameState?.currentPlayerId);
                        const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
                        const nextPlayer = players[nextPlayerIndex];
                        return nextPlayer?.nickname || nextPlayer?.name || 'Unknown';
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
                  <div className="text-muted-foreground">
                    {gameState.totalDice} on the board
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
                        if (gameState.revealedDice) {
                          // Calculate total count for each die value across all players
                          const totalCount = Object.values(gameState.revealedDice).reduce((sum, dice) => {
                            return sum + dice.filter(d => d === val).length;
                          }, 0);
                          return (
                            <td key={val} className="text-base font-bold text-primary align-middle">
                              {totalCount || '0'}
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
                {/* Palifico/Non-Palifico Round indicator */}
                <div className="mt-2 text-xs font-medium text-center">
                  {gameState.isPalifico ? 'Palifico' : 'Non Palifico'} Round
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Dice */}
        <Card className="mb-4 border-accent">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Your Dice</CardTitle>
            <Button 
              size="sm" 
              variant="outline"
              onClick={rollDice}
              disabled={isRolling}
            >
              {isRolling ? 'Rolling...' : 'Roll'}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-2">
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
          </CardContent>
        </Card>

        {/* Controls */}
        <Card>
          <CardContent className="py-4">
            <div className="space-y-4">
              {/* Bid Controls */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground">Count</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCount(Math.max(1, selectedCount - 1))}
                    >
                      -
                    </Button>
                    <div className="flex-1 text-center font-bold text-lg">
                      {selectedCount}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCount(Math.min(gameState.totalDice, selectedCount + 1))}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Value</label>
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    {[1, 2, 3, 4, 5, 6].map((val) => (
                      <Button
                        key={val}
                        size="sm"
                        variant={selectedValue === val ? "default" : "outline"}
                        onClick={() => setSelectedValue(val)}
                        className="p-1 h-auto"
                      >
                        <Dice value={val as 1 | 2 | 3 | 4 | 5 | 6} size="sm" className="pointer-events-none" />
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={handleBid}
                  className="bg-secondary hover:bg-secondary/90"
                  disabled={currentGame?.gameState?.currentPlayerId !== user?.email}
                >
                  Bid
                </Button>
                <Button
                  onClick={handleDudo}
                  variant="destructive"
                  disabled={!gameState.currentBid || currentGame?.gameState?.currentPlayerId !== user?.email}
                >
                  Dudo!
                </Button>
                <Button
                  onClick={handleCalza}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={!gameState.currentBid || currentGame?.gameState?.currentPlayerId !== user?.email || currentGame?.gameState?.currentWager?.playerId === user?.email}
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
    </div>
  );
};

export default PerudoGame;