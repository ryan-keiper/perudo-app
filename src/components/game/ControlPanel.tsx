import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Minus,
  Swords,
  Shield,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ControlPanelProps {
  currentBid?: { count: number; value: number };
  totalDice: number;
  isPalifico: boolean;
  isMyTurn: boolean;
  isStartOfRound: boolean;
  onBid: (count: number, value: number) => void;
  onDudo: () => void;
  onCalza: () => void;
  onSetDirection?: (direction: 'up' | 'down') => void;
  disabled?: boolean;
}

const ControlPanel = ({
  currentBid,
  totalDice,
  isPalifico,
  isMyTurn,
  isStartOfRound,
  onBid,
  onDudo,
  onCalza,
  onSetDirection,
  disabled = false
}: ControlPanelProps) => {
  const [selectedCount, setSelectedCount] = useState(currentBid?.count || 1);
  const [selectedValue, setSelectedValue] = useState(currentBid?.value || 1);
  const [direction, setDirection] = useState<'up' | 'down'>('up');

  // Validate bid based on current bid
  const isValidBid = () => {
    if (!currentBid) return true;
    
    if (isPalifico) {
      // In Palifico, value must stay the same, count must increase
      return selectedValue === currentBid.value && selectedCount > currentBid.count;
    }
    
    // Normal round: either increase count or increase value with any count
    if (selectedValue > currentBid.value) return true;
    if (selectedValue === currentBid.value && selectedCount > currentBid.count) return true;
    return false;
  };

  const handleBidSubmit = () => {
    if (isValidBid() && !disabled) {
      onBid(selectedCount, selectedValue);
    }
  };

  const handleDirectionSelect = (dir: 'up' | 'down') => {
    setDirection(dir);
    onSetDirection?.(dir);
  };

  const adjustCount = (delta: number) => {
    const newCount = Math.max(1, Math.min(totalDice, selectedCount + delta));
    setSelectedCount(newCount);
  };

  const diceSymbols = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  return (
    <Card className="shadow-xl border-2 border-primary/20">
      <CardContent className="p-4 space-y-4">
        {/* Direction Selection (only at start of round) */}
        {isStartOfRound && isMyTurn && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Choose Direction
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={direction === 'up' ? 'default' : 'outline'}
                onClick={() => handleDirectionSelect('up')}
                className="gap-2"
                disabled={disabled}
              >
                <ArrowUp className="size-4" />
                Up
              </Button>
              <Button
                variant={direction === 'down' ? 'default' : 'outline'}
                onClick={() => handleDirectionSelect('down')}
                className="gap-2"
                disabled={disabled}
              >
                <ArrowDown className="size-4" />
                Down
              </Button>
            </div>
          </div>
        )}

        {/* Bid Controls */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            Your Wager
          </div>
          
          {/* Count Selector */}
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="outline"
              onClick={() => adjustCount(-1)}
              disabled={disabled || selectedCount <= 1}
              className="size-10"
            >
              <Minus className="size-4" />
            </Button>
            
            <div className="flex-1 text-center">
              <div className="text-3xl font-bold text-primary">
                {selectedCount}
              </div>
              <div className="text-xs text-muted-foreground">dice</div>
            </div>
            
            <Button
              size="icon"
              variant="outline"
              onClick={() => adjustCount(1)}
              disabled={disabled || selectedCount >= totalDice}
              className="size-10"
            >
              <Plus className="size-4" />
            </Button>
          </div>

          {/* Value Selector */}
          <div className="grid grid-cols-6 gap-2">
            {diceSymbols.map((symbol, index) => {
              const value = index + 1;
              const isDisabled = isPalifico && currentBid && value !== currentBid.value;
              const isSelected = selectedValue === value;
              
              return (
                <button
                  key={value}
                  onClick={() => !isDisabled && !disabled && setSelectedValue(value)}
                  disabled={disabled || isDisabled}
                  className={cn(
                    "relative text-3xl size-10 flex items-center justify-center rounded transition-all p-0",
                    "hover:scale-110 disabled:pointer-events-none",
                    isSelected ? [
                      "text-primary-foreground bg-primary",
                      "border-2 border-amber-500 shadow-lg shadow-amber-500/30",
                    ] : [
                      "text-foreground bg-background",
                      "border border-border hover:bg-accent/10",
                    ],
                    value === 1 && !isPalifico && !isSelected && "text-accent border-accent",
                    isDisabled && "opacity-30"
                  )}
                >
                  <span className="leading-none">{symbol}</span>
                </button>
              );
            })}
          </div>

          {/* Wild indicator */}
          {!isPalifico && (
            <div className="text-xs text-center text-accent">
              ⚀ Aces are wild!
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={handleBidSubmit}
            disabled={disabled || !isValidBid() || !isMyTurn}
            className="bg-secondary hover:bg-secondary/90 gap-2"
          >
            <Swords className="size-4" />
            Bid
          </Button>
          
          <Button
            onClick={onDudo}
            disabled={disabled || !currentBid}
            variant="destructive"
            className="gap-2"
          >
            <Shield className="size-4" />
            Dudo!
          </Button>
          
          <Button
            onClick={onCalza}
            disabled={disabled || !currentBid}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
          >
            <Star className="size-4" />
            Calza!
          </Button>
        </div>

        {/* Current Bid Display */}
        {currentBid && (
          <div className="pt-3 border-t">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">
                Current Bid to Beat
              </div>
              <div className="text-xl font-bold text-primary">
                {currentBid.count} × {diceSymbols[currentBid.value - 1]}
              </div>
            </div>
          </div>
        )}

        {/* Invalid Bid Warning */}
        {currentBid && !isValidBid() && isMyTurn && (
          <div className="text-xs text-center text-destructive">
            Bid must be higher than current bid
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ControlPanel;