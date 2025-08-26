import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { auth } from '@/firebase/firebase';
import { signOut } from 'firebase/auth';
import { createGame, subscribeToActiveGames, cancelGame, type Game } from '@/lib/firebase-game';
import { ProfileEditor } from '@/components/ProfileEditor';
import { calculateSuccessRates, getTopPlayersByWins, type LeaderboardPlayer } from '@/lib/firebase-user';
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
  Loader2,
  Settings,
  X,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

const MainHub = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [cancelGameId, setCancelGameId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Subscribe to active games
  useEffect(() => {
    const unsubscribe = subscribeToActiveGames((games) => {
      setActiveGames(games);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load leaderboard
  useEffect(() => {
    const loadLeaderboard = async () => {
      const topPlayers = await getTopPlayersByWins(3);
      setLeaderboard(topPlayers);
    };
    
    loadLeaderboard();
    // Refresh leaderboard when profile updates (in case user's wins changed)
  }, [profile]);

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
      const hostName = profile?.nickname || user.email.split('@')[0];
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

  const handleCancelGame = async () => {
    if (!cancelGameId || !user?.email) return;
    
    setIsCancelling(true);
    try {
      await cancelGame(cancelGameId, user.email);
      setCancelGameId(null);
    } catch (error) {
      console.error('Error cancelling game:', error);
    } finally {
      setIsCancelling(false);
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
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                >
                  <span className="text-2xl">{profile?.avatar || '👤'}</span>
                  <span className="hidden sm:inline">{profile?.nickname || 'Profile'}</span>
                  <Settings className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowProfileEditor(true)}
                  className="gap-2"
                >
                  <User className="size-4" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2">
                    {theme === 'dark' ? <Moon className="size-4" /> : theme === 'light' ? <Sun className="size-4" /> : <Monitor className="size-4" />}
                    Theme
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
                      <Sun className="size-4" />
                      Light
                      {theme === 'light' && <span className="ml-auto">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
                      <Moon className="size-4" />
                      Dark
                      {theme === 'dark' && <span className="ml-auto">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
                      <Monitor className="size-4" />
                      System
                      {theme === 'system' && <span className="ml-auto">✓</span>}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4 text-6xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-2xl shadow-lg">
            {profile?.avatar || '🎲'}
          </div>
          <h2 className="text-3xl font-bold mb-2">
            Ahoy, {profile?.nickname || user?.email?.split('@')[0] || 'Matey'}!
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
                Leaderboard
              </CardTitle>
              <CardDescription>
                Top pirates by overall win count
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.length > 0 ? (
                  leaderboard.map((player, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`font-bold ${index === 0 ? 'text-accent text-xl' : 'text-muted-foreground'}`}>
                          #{index + 1}
                        </div>
                        <span className="text-2xl">{player.avatar}</span>
                        <div className="font-medium">{player.nickname}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="size-4 text-accent" />
                        <span className="font-bold">{player.gamesWon}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Trophy className="size-8 mx-auto mb-2 opacity-50" />
                    <p>No games completed yet</p>
                    <p className="text-sm mt-1">Be the first to win!</p>
                  </div>
                )}
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
                Performance so far
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {profile ? calculateSuccessRates(profile.stats).dudoSuccessRate : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Dudo Success</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--success)]">
                    {profile ? calculateSuccessRates(profile.stats).calzaSuccessRate : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Calza Success</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">
                    {profile?.stats.gamesWon || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Games Won</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">
                    {profile?.stats.currentWinStreak || 0}
                  </div>
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
                    className="border-secondary/50 hover:border-secondary transition-all relative"
                  >
                    {/* Cancel button in top-right corner */}
                    {game.hostEmail === user?.email && (
                      <Button
                        onClick={() => setCancelGameId(game.id || null)}
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-destructive hover:text-destructive hover:bg-destructive/10 z-10"
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                    
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1 pr-8">
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
                        <div className="flex">
                          <Button
                            onClick={() => handleJoinGame(game)}
                            variant="outline"
                            className="gap-2 group border-secondary hover:bg-secondary hover:text-secondary-foreground w-full sm:w-auto"
                          >
                            <Ship className="size-4 group-hover:animate-bounce" />
                            {game.status === 'active' && user?.email && game.players.includes(user.email) ? 'Rejoin Game' : 'Join Game'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Profile Editor Dialog - Show loading state if profile not yet loaded */}
      {showProfileEditor && !profile && (
        <Dialog open={showProfileEditor} onOpenChange={() => setShowProfileEditor(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Loading Profile...</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Profile Editor Dialog */}
      {profile && showProfileEditor && (
        <ProfileEditor
          profile={profile}
          isOpen={showProfileEditor}
          onClose={() => setShowProfileEditor(false)}
          onProfileUpdate={async () => {
            await refreshProfile();
            setShowProfileEditor(false);
          }}
        />
      )}

      {/* Cancel Game Confirmation Dialog */}
      <Dialog open={!!cancelGameId} onOpenChange={(open) => !open && setCancelGameId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Game?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Are you sure you want to cancel this game?
            </p>
            {activeGames.find(g => g.id === cancelGameId)?.status === 'active' && (
              <p className="mt-2 font-medium text-destructive">
                This game is currently active and will end for all players.
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setCancelGameId(null)}
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
    </div>
  );
};

export default MainHub;