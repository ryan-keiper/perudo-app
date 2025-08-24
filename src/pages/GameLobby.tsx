import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/auth-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  joinGame, 
  subscribeToActiveGames, 
  updatePlayerReady,
  updateGameSettings,
  startGame as startGameInFirebase,
  cancelGame,
  type Game, 
  type GamePlayer,
  type GameSettings
} from '@/lib/firebase-game';
import { 
  Check, 
  ArrowLeft,
  Users,
  Crown,
  Dices,
  Settings,
  Play,
  UserPlus,
  Anchor,
  X
} from 'lucide-react';

const GameLobby = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { user, profile } = useAuth();
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationMessage, setCancellationMessage] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState<GameSettings>({
    startingDice: 5,
    sevenDiceWins: true,
    sevenCalzasWins: true,
    palificoRules: true,
    ghostMode: true
  });
  
  const roomCode = gameId?.toUpperCase() || 'ABCD';
  const maxPlayers = 9;
  const myPlayer = players.find(p => p.email === user?.email);
  const isReady = myPlayer?.isReady || false;
  const isHost = currentGame?.hostEmail === user?.email;
  const canStartGame = players.filter(p => p.isReady).length >= 2 && isHost;

  // Subscribe to game updates
  useEffect(() => {
    if (!roomCode) return;

    const unsubscribe = subscribeToActiveGames((games) => {
      const game = games.find(g => g.code === roomCode);
      if (game) {
        setCurrentGame(game);
        
        // Extract players from game state
        if (game.gameState?.players) {
          const playerList = Object.values(game.gameState.players);
          setPlayers(playerList);
        }
        
        // Update local settings from game
        if (game.settings) {
          setLocalSettings(game.settings);
        }
        
        // Navigate to game if it started
        if (game.status === 'active' && hasJoined) {
          navigate(`/game/${roomCode}`);
        }
        
        // Handle game cancellation
        if (game.status === 'cancelled') {
          setCancellationMessage('Game was cancelled by the host');
          setTimeout(() => {
            navigate('/main-hub');
          }, 2000);
        }
      } else if (!isJoining) {
        // Game doesn't exist, go back to main hub
        navigate('/main-hub');
      }
    });

    return () => unsubscribe();
  }, [roomCode, navigate, hasJoined, isJoining]);

  // Auto-join game on mount
  useEffect(() => {
    const autoJoin = async () => {
      if (!user?.email || !roomCode || hasJoined || isJoining) return;
      
      setIsJoining(true);
      try {
        const userName = profile?.nickname || user.email.split('@')[0];
        const result = await joinGame(roomCode, user.email, userName);
        setHasJoined(true);
        
        // If game is already active, navigate directly to game screen
        if (result.isActive) {
          navigate(`/game/${roomCode}`);
        }
      } catch (error) {
        console.error('Error joining game:', error);
        navigate('/main-hub');
      } finally {
        setIsJoining(false);
      }
    };

    autoJoin();
  }, [user, roomCode, hasJoined, isJoining, navigate, profile?.nickname]);

  const handleReady = async () => {
    if (!currentGame?.id || !user?.email) return;
    
    try {
      await updatePlayerReady(currentGame.id, user.email, !isReady);
    } catch (error) {
      console.error('Error updating ready status:', error);
    }
  };

  const handleStartGame = async () => {
    if (!canStartGame || !currentGame?.id || isStartingGame) return;
    
    setIsStartingGame(true);
    try {
      await startGameInFirebase(currentGame.id);
      // Navigation will happen automatically via subscription
    } catch (error) {
      console.error('Error starting game:', error);
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleLeave = () => {
    // TODO: Remove player from game in Firebase
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
  
  const handleSaveSettings = async () => {
    if (!currentGame?.id || !isHost) return;
    
    try {
      await updateGameSettings(currentGame.id, localSettings);
      setShowSettings(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeave}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Leave Lobby
          </Button>
          <div className="flex items-center gap-2">
            <Anchor className="size-5 text-primary" />
            <span className="font-bold text-primary">Game Lobby</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Game Status Bar */}
        <Card className="mb-6">
          <CardContent className="py-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-muted-foreground">Game ID:</span>
              <span className="font-mono font-bold text-lg text-accent">{roomCode}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Waiting for pirates to join...</span>
            </div>
          </CardContent>
        </Card>

        {/* Players Grid */}
        <div className="grid gap-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="size-5" />
              Crew Assembly ({players.length}/{maxPlayers})
            </h3>
            {isHost && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="size-4" />
                Game Settings
              </Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Show joined players */}
            {players.map((player) => (
              <Card 
                key={player.id} 
                className={`transition-all ${
                  player.isReady 
                    ? 'border-[var(--success)] shadow-lg' 
                    : 'border-border'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                        {(player.nickname || player.name)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          {player.nickname || player.name}
                          {player.email === currentGame?.hostEmail && (
                            <Crown className="size-4 text-accent" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {player.isReady ? 'Ready' : 'Waiting'}
                        </div>
                      </div>
                    </div>
                    {player.isReady && (
                      <Check className="size-5 text-[var(--success)]" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Show empty slots */}
            {Array.from({ length: maxPlayers - players.length }).map((_, i) => (
              <Card key={`empty-${i}`} className="border-dashed opacity-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <UserPlus className="size-5" />
                    <span>Empty Slot</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant={isReady ? "secondary" : "default"}
            size="lg"
            className="flex-1 gap-2"
            onClick={handleReady}
          >
            <Dices className="size-5" />
            {isReady ? 'Not Ready' : 'Ready Up'}
          </Button>

          {isHost && (
            <>
              <Button
                size="lg"
                className="flex-1 gap-2 bg-[var(--success)] hover:bg-[var(--success)]/90"
                onClick={handleStartGame}
                disabled={!canStartGame}
              >
                <Play className="size-5" />
                Start Game
              </Button>
              <Button
                size="lg"
                variant="destructive"
                className="gap-2"
                onClick={() => setShowCancelDialog(true)}
              >
                <X className="size-5" />
                Cancel Game
              </Button>
            </>
          )}
        </div>

        {/* Game Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Game Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Starting Dice</span>
              <span className="font-medium">{localSettings.startingDice} per player</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Seven Dice Wins</span>
              <span className="font-medium">{localSettings.sevenDiceWins ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Seven Calzas Wins</span>
              <span className="font-medium">{localSettings.sevenCalzasWins ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Palifico Rules</span>
              <span className="font-medium">{localSettings.palificoRules ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ghost Mode</span>
              <span className="font-medium">{localSettings.ghostMode ? 'Enabled' : 'Disabled'}</span>
            </div>
          </CardContent>
        </Card>
      </main>
      
      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogHeader>
          <DialogTitle>Game Settings</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            {/* Starting Dice */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Starting Dice</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocalSettings(prev => ({ 
                    ...prev, 
                    startingDice: Math.max(1, prev.startingDice - 1) 
                  }))}
                  disabled={localSettings.startingDice <= 1}
                >
                  -
                </Button>
                <span className="w-8 text-center font-medium">
                  {localSettings.startingDice}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocalSettings(prev => ({ 
                    ...prev, 
                    startingDice: Math.min(6, prev.startingDice + 1) 
                  }))}
                  disabled={localSettings.startingDice >= 6}
                >
                  +
                </Button>
              </div>
            </div>
            
            {/* Seven Dice Wins */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Seven Dice Wins</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Enabled</span>
                <Switch
                  checked={localSettings.sevenDiceWins}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ 
                    ...prev, 
                    sevenDiceWins: checked 
                  }))}
                  className="data-[state=checked]:bg-secondary"
                />
                <span className="text-xs text-muted-foreground">Disabled</span>
              </div>
            </div>
            
            {/* Seven Calzas Wins */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Seven Calzas Wins</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Enabled</span>
                <Switch
                  checked={localSettings.sevenCalzasWins}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ 
                    ...prev, 
                    sevenCalzasWins: checked 
                  }))}
                  className="data-[state=checked]:bg-secondary"
                />
                <span className="text-xs text-muted-foreground">Disabled</span>
              </div>
            </div>
            
            {/* Palifico Rules */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Palifico Rules</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Enabled</span>
                <Switch
                  checked={localSettings.palificoRules}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ 
                    ...prev, 
                    palificoRules: checked 
                  }))}
                  className="data-[state=checked]:bg-secondary"
                />
                <span className="text-xs text-muted-foreground">Disabled</span>
              </div>
            </div>
            
            {/* Ghost Mode */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Ghost Mode</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Enabled</span>
                <Switch
                  checked={localSettings.ghostMode}
                  onCheckedChange={(checked) => setLocalSettings(prev => ({ 
                    ...prev, 
                    ghostMode: checked 
                  }))}
                  className="data-[state=checked]:bg-secondary"
                />
                <span className="text-xs text-muted-foreground">Disabled</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              className="bg-secondary hover:bg-secondary/90"
            >
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Game Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Game?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Are you sure you want to cancel this game? 
              {players.length > 1 && (
                <span className="block mt-2 font-medium">
                  This will remove all {players.length} players from the lobby.
                </span>
              )}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Game
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

export default GameLobby;