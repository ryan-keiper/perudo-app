import { cn } from '@/lib/utils';
import type { GamePlayer } from '@/lib/firebase-game';
import { PlayerRow } from './player-row';
import { Star, Dices, User, Zap } from 'lucide-react';

interface GameBoardProps {
  players: GamePlayer[];
  currentPlayerId?: string;
  currentUserEmail?: string;
  revealedDice?: { [playerId: string]: number[] };
  className?: string;
}

export function GameBoard({
  players,
  currentPlayerId,
  currentUserEmail,
  revealedDice,
  className
}: GameBoardProps) {
  return (
    <div className={cn(
      "game-board bg-card rounded-xl border shadow-lg overflow-hidden",
      className
    )}>
      {/* Board Header */}
      <div className="board-header bg-secondary/10 border-b-2 border-secondary sticky top-0 z-10">
        <div className="grid px-3 sm:px-6 py-2 sm:py-3" style={{ gridTemplateColumns: '10% 40% 40% 10%' }}>
          <div className="flex items-center gap-0.5 sm:gap-1 justify-center">
            <Star className="size-3 sm:size-4 text-secondary" />
            <span className="hidden sm:inline text-xs font-semibold text-secondary uppercase tracking-tight">
              CALZAS
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <User className="size-3 sm:size-4 text-secondary" />
            <span className="text-xs sm:text-sm font-semibold text-secondary uppercase tracking-wide">
              Athlete
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 justify-start">
            <Dices className="size-3 sm:size-4 text-secondary" />
            <span className="text-xs sm:text-sm font-semibold text-secondary uppercase tracking-wide">
              Dice
            </span>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 justify-center">
            <Zap className="size-3 sm:size-4 text-secondary" />
            <span className="hidden sm:inline text-xs font-semibold text-secondary uppercase tracking-tight">
              STATUS
            </span>
          </div>
        </div>
      </div>

      {/* Board Body */}
      <div className="board-body">
        {players.map((player, index) => (
          <PlayerRow
            key={player.id}
            player={player}
            isCurrentTurn={currentPlayerId === player.email}
            isCurrentUser={currentUserEmail === player.email}
            revealedDice={revealedDice?.[player.id]}
            isLastRow={index === players.length - 1}
          />
        ))}
      </div>
    </div>
  );
}