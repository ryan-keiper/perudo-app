import { cn } from '@/lib/utils';
import { Dice } from './dice';
import type { DiceProps } from './dice';

interface DiceDisplayProps {
  diceCount: number;
  revealedDice?: number[];
  maxDice?: number;
  size?: DiceProps['size'];
  responsiveSize?: boolean;
  className?: string;
}

export function DiceDisplay({
  diceCount,
  revealedDice,
  maxDice = 6,
  size = 'sm',
  responsiveSize = false,
  className
}: DiceDisplayProps) {
  const diceArray = Array.from({ length: Math.min(diceCount, maxDice) }, (_, i) => i);

  return (
    <div className={cn(
      "dice-display flex items-center gap-1",
      className
    )}>
      {diceArray.map((index) => {
        const revealed = revealedDice && revealedDice[index];
        const isRevealed = revealed !== undefined;
        
        return responsiveSize ? (
          <>
            {/* Mobile: xs size */}
            <div key={`${index}-mobile`} className="sm:hidden">
              <Dice
                value={revealed as 1 | 2 | 3 | 4 | 5 | 6 | undefined}
                isHidden={!isRevealed}
                size="xs"
              />
            </div>
            {/* Desktop: sm size */}
            <div key={`${index}-desktop`} className="hidden sm:block">
              <Dice
                value={revealed as 1 | 2 | 3 | 4 | 5 | 6 | undefined}
                isHidden={!isRevealed}
                size="sm"
              />
            </div>
          </>
        ) : (
          <Dice
            key={index}
            value={revealed as 1 | 2 | 3 | 4 | 5 | 6 | undefined}
            isHidden={!isRevealed}
            size={size}
          />
        );
      })}
      
      {/* Show remaining dice count if more than max */}
      {diceCount > maxDice && (
        <div className="text-xs text-muted-foreground ml-1">
          +{diceCount - maxDice}
        </div>
      )}
    </div>
  );
}