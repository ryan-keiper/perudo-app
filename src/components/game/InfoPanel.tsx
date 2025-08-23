import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpectedValue {
  value: number;
  base: number;
  adjusted: number;
  actual?: number;
}

interface InfoPanelProps {
  totalDice: number;
  isPalifico: boolean;
  myDice: number[];
  revealedTotals?: { [key: number]: number };
  showReveal?: boolean;
}

const InfoPanel = ({
  totalDice,
  isPalifico,
  myDice,
  revealedTotals,
  showReveal = false
}: InfoPanelProps) => {
  const diceSymbols = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  
  // Calculate expected values
  const calculateExpectedValues = (): ExpectedValue[] => {
    const values: ExpectedValue[] = [];
    
    for (let i = 1; i <= 6; i++) {
      // Count my dice
      const myCount = myDice.filter(d => d === i || (!isPalifico && d === 1 && i !== 1)).length;
      
      // Base expected value
      let baseExpected: number;
      if (isPalifico) {
        // In Palifico, no wilds
        baseExpected = totalDice / 6;
      } else {
        // Normal: 1s are wild
        if (i === 1) {
          baseExpected = totalDice / 6;
        } else {
          baseExpected = (totalDice / 6) * 2; // Die value + wild aces
        }
      }
      
      // Adjusted expected value (accounting for my known dice)
      const remainingDice = totalDice - myDice.length;
      let adjustedExpected: number;
      
      if (remainingDice === 0) {
        adjustedExpected = myCount;
      } else {
        if (isPalifico) {
          adjustedExpected = myCount + (remainingDice / 6);
        } else {
          if (i === 1) {
            adjustedExpected = myCount + (remainingDice / 6);
          } else {
            const myAces = myDice.filter(d => d === 1).length;
            const myExactValue = myDice.filter(d => d === i).length;
            adjustedExpected = myExactValue + myAces + ((remainingDice / 6) * 2);
          }
        }
      }
      
      values.push({
        value: i,
        base: baseExpected,
        adjusted: adjustedExpected,
        actual: revealedTotals?.[i]
      });
    }
    
    return values;
  };

  const expectedValues = calculateExpectedValues();

  return (
    <div className="space-y-3">
      {/* Expected Values Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Calculator className="size-4" />
            Expected Values
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-2">
            {expectedValues.map((ev) => (
              <div key={ev.value} className="text-center space-y-1">
                {/* Die Symbol */}
                <div className="text-2xl">
                  {diceSymbols[ev.value - 1]}
                </div>
                
                {/* Base Expected */}
                <div className="text-xs text-muted-foreground">
                  {ev.base.toFixed(1)}
                </div>
                
                {/* Adjusted Expected */}
                <div className={cn(
                  "text-sm font-bold",
                  ev.adjusted > ev.base ? "text-[var(--success)]" : "text-accent"
                )}>
                  {ev.adjusted.toFixed(1)}
                </div>
                
                {/* Actual (if revealed) */}
                {showReveal && ev.actual !== undefined && (
                  <div className={cn(
                    "text-lg font-bold pt-1 border-t",
                    ev.actual >= Math.ceil(ev.adjusted) ? "text-[var(--success)]" : "text-destructive"
                  )}>
                    {ev.actual}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="mt-3 pt-3 border-t flex justify-around text-xs">
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full bg-muted-foreground" />
              <span>Base</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full bg-accent" />
              <span>Adjusted</span>
            </div>
            {showReveal && (
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-primary" />
                <span>Actual</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-secondary/10">
        <CardContent className="py-3">
          <div className="flex items-start gap-2">
            <Info className="size-4 text-secondary mt-0.5" />
            <div className="text-xs space-y-1">
              {isPalifico ? (
                <p className="text-[var(--warning)] font-medium">
                  PALIFICO: Aces are NOT wild!
                </p>
              ) : (
                <p>
                  <span className="font-medium">Remember:</span> Aces (⚀) count as any value!
                </p>
              )}
              <p className="text-muted-foreground">
                Base = Mathematical average • Adjusted = Including your dice
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totals Summary (when revealed) */}
      {showReveal && revealedTotals && (
        <Card className="border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="size-4" />
              Round Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(revealedTotals)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([value, count]) => count > 0 && (
                  <div key={value} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {diceSymbols[Number(value) - 1]}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {Number(value) === 1 && !isPalifico ? '(wild)' : ''}
                      </span>
                    </div>
                    <div className="font-bold text-primary">
                      {count} dice
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InfoPanel;