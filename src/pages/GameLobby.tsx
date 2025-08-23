import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Copy, 
  Check, 
  ArrowLeft,
  Users,
  Crown,
  Dices,
  Settings,
  Play,
  UserPlus,
  Anchor
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  avatar?: string;
}

const GameLobby = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // Generate or use room code
  const roomCode = gameId === 'new' 
    ? Math.random().toString(36).substring(2, 6).toUpperCase()
    : gameId === 'quick' 
    ? 'QUICK' 
    : gameId?.toUpperCase() || 'ABCD';

  // Mock players for now
  const [players, setPlayers] = useState<Player[]>([
    {
      id: '1',
      name: user?.email?.split('@')[0] || 'You',
      isReady: false,
      isHost: true,
    }
  ]);

  const maxPlayers = 6;
  const canStartGame = players.filter(p => p.isReady).length >= 2;
  const isHost = players.find(p => p.id === '1')?.isHost || false;

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReady = () => {
    setIsReady(!isReady);
    // TODO: Update ready status in Firebase
  };

  const handleStartGame = () => {
    if (canStartGame) {
      // TODO: Create game instance in Firebase
      navigate(`/game/${roomCode}`);
    }
  };

  const handleLeave = () => {
    navigate('/main-hub');
  };

  // Simulate players joining
  useEffect(() => {
    const timer = setTimeout(() => {
      if (players.length < 3) {
        setPlayers(prev => [...prev, {
          id: String(prev.length + 1),
          name: `Pirate${prev.length + 1}`,
          isReady: Math.random() > 0.5,
          isHost: false
        }]);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [players]);

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
        {/* Room Code Card */}
        <Card className="mb-6 border-accent">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Room Code</CardTitle>
            <CardDescription>Share this code with your crew</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="text-5xl font-mono font-bold text-accent tracking-wider">
                {roomCode}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
                className="size-12"
              >
                {copied ? (
                  <Check className="size-5 text-[var(--success)]" />
                ) : (
                  <Copy className="size-5" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Waiting for pirates to join...
            </p>
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
              <Button variant="outline" size="sm" className="gap-2">
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
                        {player.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          {player.name}
                          {player.isHost && (
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
            <Button
              size="lg"
              className="flex-1 gap-2 bg-[var(--success)] hover:bg-[var(--success)]/90"
              onClick={handleStartGame}
              disabled={!canStartGame}
            >
              <Play className="size-5" />
              Start Game
            </Button>
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
              <span className="font-medium">5 per player</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Calza Limit</span>
              <span className="font-medium">7 to win</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Palifico Rules</span>
              <span className="font-medium">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ghost Mode</span>
              <span className="font-medium">Enabled</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default GameLobby;