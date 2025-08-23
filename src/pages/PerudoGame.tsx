import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dices,
  ArrowUp,
  ArrowDown,
  Star,
  AlertCircle,
  ArrowLeft,
  Anchor
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  diceCount: number;
  calzaCount: number;
  status: 'alive' | 'ghost' | 'zombie' | 'dead';
  isActive: boolean;
  dice?: number[];
}

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
  
  // Mock game state
  const [players] = useState<Player[]>([
    { id: '1', name: 'You', diceCount: 5, calzaCount: 2, status: 'alive', isActive: true, dice: [1, 3, 3, 5, 6] },
    { id: '2', name: 'Chris', diceCount: 3, calzaCount: 1, status: 'alive', isActive: false },
    { id: '3', name: 'Showrunner', diceCount: 5, calzaCount: 0, status: 'alive', isActive: false },
    { id: '4', name: 'Christian', diceCount: 4, calzaCount: 3, status: 'alive', isActive: false },
    { id: '5', name: 'Denis', diceCount: 2, calzaCount: 1, status: 'alive', isActive: false },
  ]);

  const [gameState, setGameState] = useState<GameState>({
    currentBid: { count: 5, value: 6 },
    totalDice: players.reduce((sum, p) => sum + p.diceCount, 0),
    isPalifico: false,
    roundDirection: 'up'
  });

  const [selectedCount, setSelectedCount] = useState(1);
  const [selectedValue, setSelectedValue] = useState(1);
  const [myDice, setMyDice] = useState([1, 3, 3, 5, 6]);
  const [isRolling, setIsRolling] = useState(false);

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

  const handleBid = () => {
    // TODO: Submit bid to Firebase
    setGameState(prev => ({
      ...prev,
      currentBid: { count: selectedCount, value: selectedValue }
    }));
  };

  const handleDudo = () => {
    // TODO: Call dudo in Firebase
    console.log('Dudo called!');
  };

  const handleCalza = () => {
    // TODO: Call calza in Firebase
    console.log('Calza called!');
  };

  const handleLeaveGame = () => {
    navigate('/main-hub');
  };

  const rollDice = () => {
    setIsRolling(true);
    // Simulate dice roll
    setTimeout(() => {
      const newDice = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);
      setMyDice(newDice);
      setIsRolling(false);
    }, 1200);
  };

  const getStatusEmoji = (status: string) => {
    switch(status) {
      case 'ghost': return '👻';
      case 'zombie': return '🧟';
      case 'dead': return '☠️';
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
                      player.isActive 
                        ? 'border-accent shadow-lg shadow-accent/20' 
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">{player.name}</div>
                      {player.status !== 'alive' && (
                        <span className="text-lg">{getStatusEmoji(player.status)}</span>
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
                >
                  Bid
                </Button>
                <Button
                  onClick={handleDudo}
                  variant="destructive"
                >
                  Dudo!
                </Button>
                <Button
                  onClick={handleCalza}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
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