import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/firebase/firebase';
import { signOut } from 'firebase/auth';
import { createGame, subscribeToActiveGames, type Game } from '@/lib/firebase-game';
import { 
  Trophy, 
  Users, 
  Plus, 
  LogOut, 
  Star,
  Anchor,
  Ship,
  Clock,
  User,
  Loader2
} from 'lucide-react';

const MainHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [loading, setLoading] = useState(true);

  // Subscribe to active games
  useEffect(() => {
    const unsubscribe = subscribeToActiveGames((games) => {
      setActiveGames(games);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleCreateGame = async () => {
    if (!user?.email || isCreatingGame) return;
    
    setIsCreatingGame(true);
    try {
      const hostName = user.email.split('@')[0];
      const roomCode = await createGame(user.email, hostName);
      console.log('Created game with code:', roomCode);
      // Game will appear in list via real-time subscription
    } catch (error) {
      console.error('Error creating game:', error);
      // TODO: Show error toast
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleJoinGame = (game: Game) => {
    // For active games where user is already a player, go directly to game
    if (game.status === 'active' && user?.email && game.players.includes(user.email)) {
      navigate(`/game/${game.code}`);
    } else {
      // Otherwise go to lobby (for waiting games or new players)
      navigate(`/game-lobby/${game.code}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Navigation Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Anchor className="size-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Perudo</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Ahoy, {user?.email?.split('@')[0] || 'Matey'}!
          </h2>
          <p className="text-muted-foreground">
            Ready to test your luck and deception skills?
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Weekly Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="size-5 text-accent" />
                Weekly Leaderboard
              </CardTitle>
              <CardDescription>
                This week's top pirates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Placeholder leaderboard */}
                {[
                  { rank: 1, name: 'Captain Jack', wins: 12 },
                  { rank: 2, name: 'Blackbeard', wins: 10 },
                  { rank: 3, name: 'Anne Bonny', wins: 8 },
                ].map((player) => (
                  <div key={player.rank} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`font-bold ${player.rank === 1 ? 'text-accent text-xl' : 'text-muted-foreground'}`}>
                        #{player.rank}
                      </div>
                      <div className="font-medium">{player.name}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="size-4 text-accent" />
                      <span className="font-bold">{player.wins}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Your Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="size-5 text-primary" />
                Your Stats
              </CardTitle>
              <CardDescription>
                Performance this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-primary">85%</div>
                  <p className="text-sm text-muted-foreground">Dudo Success</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--success)]">42%</div>
                  <p className="text-sm text-muted-foreground">Calza Success</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">7</div>
                  <p className="text-sm text-muted-foreground">Games Won</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">3</div>
                  <p className="text-sm text-muted-foreground">Win Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Games */}
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-5 text-secondary" />
                  Active Games
                </CardTitle>
                <CardDescription>
                  Join your crew's ongoing adventures
                </CardDescription>
              </div>
              <Button
                onClick={handleCreateGame}
                disabled={isCreatingGame}
                className="gap-2 bg-accent hover:bg-accent/90"
              >
                {isCreatingGame ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Create Game
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : activeGames.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active games. Create one to start the adventure!
              </div>
            ) : (
              <div className="grid gap-3">
                {activeGames.map((game) => (
                  <Card 
                    key={game.id}
                    className="border-secondary/50 hover:border-secondary transition-all"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-lg font-mono font-bold text-accent">
                              {game.code}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Room Code
                            </div>
                            {game.status === 'active' && (
                              <div className="flex items-center gap-1 text-[var(--warning)] text-sm">
                                <Clock className="size-3" />
                                In Progress
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="size-3" />
                              <span>Host: {game.host}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="size-3" />
                              <span>{game.playerCount}/{game.maxPlayers} players</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleJoinGame(game)}
                          variant="outline"
                          className="gap-2 group border-secondary hover:bg-secondary hover:text-secondary-foreground"
                        >
                          <Ship className="size-4 group-hover:animate-bounce" />
                          {game.status === 'active' && user?.email && game.players.includes(user.email) ? 'Rejoin Game' : 'Join Game'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MainHub;