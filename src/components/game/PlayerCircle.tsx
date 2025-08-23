import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dices, Star, Crown, Ghost, Skull, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Player {
  id: string;
  name: string;
  diceCount: number;
  calzaCount: number;
  status: 'alive' | 'ghost' | 'zombie' | 'dead';
  isActive: boolean;
  isThinking?: boolean;
  dice?: number[];
  isYou?: boolean;
}

interface PlayerCircleProps {
  players: Player[];
  showDice?: boolean;
  currentPlayerId?: string;
}

const PlayerCircle = ({ 
  players, 
  showDice = false,
  currentPlayerId 
}: PlayerCircleProps) => {
  
  const getStatusEmoji = (status: string) => {
    switch(status) {
      case 'ghost': return '👻';
      case 'zombie': return '🧟';
      case 'dead': return '☠️';
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ghost': return 'border-gray-400 opacity-60';
      case 'zombie': return 'border-[var(--warning)]';
      case 'dead': return 'border-destructive opacity-40';
      default: return 'border-border';
    }
  };

  // Create dice display icons
  const DiceIcons = ({ count, max = 7 }: { count: number; max?: number }) => {
    const displayCount = Math.min(count, max);
    const overflow = count > max;
    
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: displayCount }).map((_, i) => (
          <div
            key={i}
            className="size-4 border border-current rounded-sm"
          />
        ))}
        {overflow && (
          <span className="text-xs ml-1">+{count - max}</span>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            The Board
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {players.filter(p => p.status === 'alive').length} pirates remaining
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {players.map((player) => (
            <div
              key={player.id}
              className={cn(
                "relative p-3 rounded-lg border-2 transition-all",
                player.isActive && "shadow-lg shadow-accent/30 border-accent",
                !player.isActive && getStatusColor(player.status),
                player.isYou && "bg-accent/5"
              )}
            >
              {/* Active Player Glow Animation */}
              {player.isActive && (
                <div className="absolute inset-0 rounded-lg animate-pulse bg-accent/10 pointer-events-none" />
              )}
              
              {/* Player Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {/* Avatar */}
                  <div className={cn(
                    "size-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                    player.isActive 
                      ? "bg-gradient-to-br from-accent to-[var(--warning)]"
                      : "bg-gradient-to-br from-primary to-secondary"
                  )}>
                    {player.name[0].toUpperCase()}
                  </div>
                  
                  {/* Name and Status */}
                  <div>
                    <div className="font-medium text-sm flex items-center gap-1">
                      {player.name}
                      {player.isYou && (
                        <Crown className="size-3 text-accent" />
                      )}
                      {player.isThinking && (
                        <Clock className="size-3 text-muted-foreground animate-spin" />
                      )}
                    </div>
                    {player.status !== 'alive' && (
                      <div className="text-xs text-muted-foreground">
                        {getStatusEmoji(player.status)}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Calza Stars */}
                {player.calzaCount > 0 && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: Math.min(player.calzaCount, 7) }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={cn(
                          "size-3",
                          i < player.calzaCount ? "text-accent fill-accent" : "text-muted"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Dice Display */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs">
                  <Dices className="size-3 text-muted-foreground" />
                  <DiceIcons count={player.diceCount} />
                </div>
                
                {/* Show actual dice values when revealed */}
                {showDice && player.dice && (
                  <div className="flex gap-0.5">
                    {player.dice.sort().map((die, i) => (
                      <div 
                        key={i}
                        className="size-5 bg-[var(--copper)] rounded text-white text-xs flex items-center justify-center font-bold"
                      >
                        {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][die - 1]}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Current Turn Indicator */}
              {player.id === currentPlayerId && (
                <div className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                  TURN
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Game Stats Summary */}
        <div className="mt-4 pt-3 border-t grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="text-lg font-bold text-primary">
              {players.reduce((sum, p) => sum + p.diceCount, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Dice</div>
          </div>
          <div>
            <div className="text-lg font-bold text-accent">
              {players.reduce((sum, p) => sum + p.calzaCount, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Calzas</div>
          </div>
          <div>
            <div className="text-lg font-bold text-secondary">
              {players.filter(p => p.status === 'ghost').length}
            </div>
            <div className="text-xs text-muted-foreground">Ghosts</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerCircle;