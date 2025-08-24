import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/auth-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  subscribeToActiveGames,
  leaveGame as leaveGameInFirebase,
  reconnectToGame,
  makeBid,
  callDudo as callDudoInFirebase,
  callCalza as callCalzaInFirebase,
  type Game,
  type GamePlayer
} from '@/lib/firebase-game';
import { 
  Dices,
  ArrowUp,
  ArrowDown,
  Star,
  AlertCircle,
  ArrowLeft,
  Anchor
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

  const rollDice = () => {
    // Dice are rolled automatically by Firebase when round starts
    // This is just for visual effect during development
    if (myDice.length === 0) {
      setIsRolling(true);
      setTimeout(() => {
        const newDice = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);
        setMyDice(newDice);
        setIsRolling(false);
      }, 1200);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'ghost': return '👻';
      case 'zombie': return '🧟';
      case 'dead': return '☠️';
      case 'disconnected': return '🔌';
      default: return '';
    }
  };

  const expectedValues = calculateExpectedValues();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveGame}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Leave
          </Button>
          <div className="flex items-center gap-2">
            <Anchor className="size-5 text-primary" />
            <span className="font-bold text-primary">Room {gameId}</span>
          </div>
        </div>
      </header>

      {/* Status Bar */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Dices className="size-4 text-muted-foreground" />
              <span className="font-medium">{gameState.totalDice} dice</span>
            </div>
            {gameState.isPalifico && (
              <div className="flex items-center gap-1 text-[var(--warning)]">
                <AlertCircle className="size-4" />
                <span className="font-medium">PALIFICO</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Direction:</span>
            {gameState.roundDirection === 'up' ? (
              <ArrowUp className="size-4 text-primary" />
            ) : (
              <ArrowDown className="size-4 text-primary" />
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 max-w-6xl">
        {/* Players Circle */}
        <div className="mb-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">The Board</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      currentGame?.gameState?.currentPlayerId === player.email
                        ? 'border-accent shadow-lg shadow-accent/20' 
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">{player.nickname || player.name}</div>
                      {player.status !== 'alive' && (
                        <span className="text-lg">{getStatusIcon(player.status)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Dices className="size-3 text-muted-foreground" />
                        <span>{player.diceCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="size-3 text-accent" />
                        <span>{player.calzaCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Bid */}
        {gameState.currentBid && (
          <Card className="mb-4 border-primary">
            <CardContent className="py-3">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Current Bid</div>
                <div className="text-2xl font-bold text-primary">
                  {gameState.currentBid.count} × {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][gameState.currentBid.value - 1]}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expected Values */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Expected Values</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-2 text-center">
              {expectedValues.map((ev) => (
                <div key={ev.value} className="space-y-1">
                  <div className="text-lg">
                    {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][ev.value - 1]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ev.base}
                  </div>
                  <div className="text-sm font-medium text-accent">
                    {ev.adjusted}
                  </div>
                </div>
              ))}
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
              {myDice.map((die, index) => (
                <div
                  key={index}
                  className={`size-12 bg-[var(--copper)] rounded-lg flex items-center justify-center text-2xl text-white font-bold transition-transform ${
                    isRolling ? 'animate-spin' : ''
                  }`}
                >
                  {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][die - 1]}
                </div>
              ))}
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
                        className="text-lg p-1"
                      >
                        {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][val - 1]}
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
    </div>
  );
};

export default PerudoGame;