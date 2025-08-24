import { cn } from '@/lib/utils';
import type { GamePlayer } from '@/lib/firebase-game';
import { DiceDisplay } from './dice-display';
import { Star } from 'lucide-react';

interface PlayerRowProps {
  player: GamePlayer;
  isCurrentTurn: boolean;
  isCurrentUser: boolean;
  revealedDice?: number[];
  isLastRow?: boolean;
}

const getStatusIcon = (status: string) => {
  switch(status) {
    case 'ghost': return '👻';
    case 'zombie': return '🧟';
    case 'dead': return '☠️';
    case 'disconnected': return '🔌';
    default: return '';
  }
};

const getPlayerEmoji = (player: GamePlayer) => {
  // Use player's avatar if available
  if (player.avatar) {
    return player.avatar;
  }
  
  // Fallback to mock avatars based on player ID
  const emojis = ['🏴‍☠️', '🦜', '⚓', '🗡️', '💎', '🌊'];
  const index = player.id.charCodeAt(0) % emojis.length;
  return emojis[index];
};

export function PlayerRow({
  player,
  isCurrentTurn,
  isCurrentUser,
  revealedDice,
  isLastRow = false
}: PlayerRowProps) {
  return (
    <div
      className={cn(
        "player-row transition-all duration-200",
        !isLastRow && "border-b border-border/50",
        isCurrentTurn && [
          "bg-accent/10",
          "border-l-4 border-l-accent",
          "shadow-lg shadow-accent/10",
          "scale-[1.01]"
        ],
        !isCurrentTurn && "hover:bg-secondary/5",
        isCurrentUser && !isCurrentTurn && "bg-primary/5"
      )}
    >
      <div className="grid px-3 sm:px-6 py-2 sm:py-3 items-center" style={{ gridTemplateColumns: '10% 40% 40% 10%' }}>
        {/* Calzas Column */}
        <div className="calzas-column flex items-center justify-center relative">
          {isCurrentTurn && player.status === 'alive' && (
            <div className="turn-indicator absolute left-0 sm:left-1 size-2 sm:size-2.5 bg-accent rounded-full animate-pulse" />
          )}
          <div className={cn(
            "calza-display flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg",
            player.calzaCount > 0 && "bg-[var(--success)]/10 border border-[var(--success)]/20"
          )}>
            <Star className={cn(
              "size-3 sm:size-4",
              player.calzaCount > 0 ? "text-[var(--success)] fill-[var(--success)]" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-sm sm:text-lg font-bold tabular-nums",
              player.calzaCount > 0 ? "text-[var(--success)]" : "text-muted-foreground"
            )}>
              {player.calzaCount}
            </span>
          </div>
        </div>

        {/* Athlete Column */}
        <div className="athlete-column flex items-center gap-1 sm:gap-2">
          <div className="avatar-circle size-7 sm:size-8 bg-accent/20 border border-accent/40 rounded-full flex items-center justify-center">
            <span className="text-sm sm:text-base">{getPlayerEmoji(player)}</span>
          </div>
          <div className="player-info flex-1 min-w-0">
            <div className={cn(
              "player-name text-xs sm:text-sm font-medium truncate",
              isCurrentTurn && "text-accent"
            )}>
              {player.nickname || player.name || player.email.split('@')[0]}
            </div>
            {isCurrentUser && (
              <div className="text-[10px] sm:text-xs text-muted-foreground">You</div>
            )}
          </div>
        </div>

        {/* Dice Column */}
        <div className="dice-column flex justify-start">
          <DiceDisplay
            diceCount={player.diceCount}
            revealedDice={revealedDice || player.currentDice}
            responsiveSize={true}
          />
        </div>

        {/* Status Column */}
        <div className="status-column flex items-center justify-center">
          {player.status !== 'alive' && (
            <span className="text-base sm:text-lg">{getStatusIcon(player.status)}</span>
          )}
        </div>
      </div>
    </div>
  );
}