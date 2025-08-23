import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { auth } from '@/firebase/firebase';
import { signOut } from 'firebase/auth';
import { 
  Dices, 
  Trophy, 
  Users, 
  Plus, 
  LogOut, 
  Star,
  Anchor,
  Ship
} from 'lucide-react';

const MainHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleCreateGame = () => {
    // TODO: Create game in Firebase and navigate to lobby
    navigate('/game-lobby/new');
  };

  const handleJoinGame = () => {
    if (joinCode) {
      // TODO: Validate game code exists in Firebase
      navigate(`/game-lobby/${joinCode}`);
    }
  };

  const handleQuickMatch = () => {
    // TODO: Find or create public game
    navigate('/game-lobby/quick');
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

        {/* Game Actions Grid */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {/* Quick Match */}
          <Card 
            className="cursor-pointer hover:border-primary transition-all hover:shadow-lg group"
            onClick={handleQuickMatch}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dices className="size-5 text-primary group-hover:rotate-12 transition-transform" />
                Quick Match
              </CardTitle>
              <CardDescription>
                Jump into a public game
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">Play Now</div>
              <p className="text-sm text-muted-foreground">Find opponents instantly</p>
            </CardContent>
          </Card>

          {/* Create Private Game */}
          <Card 
            className="cursor-pointer hover:border-accent transition-all hover:shadow-lg group"
            onClick={handleCreateGame}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="size-5 text-accent group-hover:scale-110 transition-transform" />
                Create Game
              </CardTitle>
              <CardDescription>
                Host a private room
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">New Room</div>
              <p className="text-sm text-muted-foreground">Invite your crew</p>
            </CardContent>
          </Card>

          {/* Join Game */}
          <Card 
            className={`transition-all hover:shadow-lg ${showJoinInput ? 'border-secondary' : 'hover:border-secondary'} group`}
            onClick={() => !showJoinInput && setShowJoinInput(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="size-5 text-secondary group-hover:animate-bounce" />
                Join Game
              </CardTitle>
              <CardDescription>
                Enter a room code
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showJoinInput ? (
                <div className="space-y-2">
                  <Input
                    placeholder="ABCD"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                    maxLength={4}
                    className="text-center text-lg font-mono"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button 
                    className="w-full" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinGame();
                    }}
                    disabled={joinCode.length !== 4}
                  >
                    Join Room
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-secondary">Join Room</div>
                  <p className="text-sm text-muted-foreground">Enter room code</p>
                </>
              )}
            </CardContent>
          </Card>
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
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-secondary" />
              Active Games
            </CardTitle>
            <CardDescription>
              Your ongoing matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No active games. Start a new adventure!
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MainHub;