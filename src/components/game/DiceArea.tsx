import { useState, useEffect } from 'react';
import AnimatedDie from './AnimatedDie';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dices, RefreshCw } from 'lucide-react';

interface DiceAreaProps {
  diceCount: number;
  initialValues?: number[];
  onRollComplete?: (values: number[]) => void;
  autoRoll?: boolean;
  disabled?: boolean;
}

const DiceArea = ({ 
  diceCount, 
  initialValues = [], 
  onRollComplete,
  autoRoll = false,
  disabled = false
}: DiceAreaProps) => {
  const [diceValues, setDiceValues] = useState<number[]>(() => {
    if (initialValues.length > 0) {
      return initialValues.slice(0, diceCount);
    }
    // Initialize with random values
    return Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
  });
  
  const [isRolling, setIsRolling] = useState(false);
  const [completedRolls, setCompletedRolls] = useState(0);

  useEffect(() => {
    // Auto roll on mount if specified
    if (autoRoll && !isRolling) {
      handleRoll();
    }
  }, [autoRoll]);

  useEffect(() => {
    // Adjust dice array if count changes
    if (diceValues.length !== diceCount) {
      setDiceValues(prev => {
        if (diceCount > prev.length) {
          // Add new dice
          const newDice = Array.from(
            { length: diceCount - prev.length }, 
            () => Math.floor(Math.random() * 6) + 1
          );
          return [...prev, ...newDice];
        } else {
          // Remove dice
          return prev.slice(0, diceCount);
        }
      });
    }
  }, [diceCount]);

  const handleRoll = () => {
    if (disabled || isRolling) return;
    
    setIsRolling(true);
    setCompletedRolls(0);
    
    // Start rolling animation
    setTimeout(() => {
      // Animation will complete in AnimatedDie components
    }, 100);
  };

  const handleDieRollComplete = (index: number, value: number) => {
    setDiceValues(prev => {
      const newValues = [...prev];
      newValues[index] = value;
      return newValues;
    });
    
    setCompletedRolls(prev => {
      const newCount = prev + 1;
      
      // All dice have finished rolling
      if (newCount === diceCount) {
        setIsRolling(false);
        // Get final values and notify parent
        setTimeout(() => {
          onRollComplete?.(diceValues);
        }, 100);
      }
      
      return newCount;
    });
  };

  // Sort dice for display (optional - makes it easier to count)
  const sortedIndices = [...Array(diceCount).keys()].sort(
    (a, b) => diceValues[a] - diceValues[b]
  );

  return (
    <Card className="border-accent shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Dices className="size-5 text-accent" />
            Your Dice
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRoll}
            disabled={disabled || isRolling}
            className="gap-2"
          >
            <RefreshCw className={`size-4 ${isRolling ? 'animate-spin' : ''}`} />
            {isRolling ? 'Rolling...' : 'Roll Dice'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap justify-center gap-3">
          {sortedIndices.map((originalIndex) => (
            <div
              key={originalIndex}
              className="relative"
            >
              <AnimatedDie
                value={diceValues[originalIndex]}
                isRolling={isRolling}
                size="lg"
                onRollComplete={(value) => handleDieRollComplete(originalIndex, value)}
                className="transition-transform hover:scale-110"
              />
              
              {/* Optional: Show die number for debugging */}
              {process.env.NODE_ENV === 'development' && (
                <div className="absolute -top-2 -right-2 size-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-bold">
                  {originalIndex + 1}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Dice Summary */}
        <div className="mt-4 pt-3 border-t">
          <div className="flex justify-center gap-4 text-sm">
            {[1, 2, 3, 4, 5, 6].map(value => {
              const count = diceValues.filter(v => v === value).length;
              return count > 0 ? (
                <div key={value} className="flex items-center gap-1">
                  <span className="text-lg">
                    {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][value - 1]}
                  </span>
                  <span className="font-bold text-accent">×{count}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiceArea;