import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const diceVariants = cva(
  'dice relative inline-block transition-all cursor-pointer',
  {
    variants: {
      size: {
        xs: 'size-6',
        sm: 'size-8',
        md: 'size-12',
        lg: 'size-16',
        xl: 'size-20',
      },
      state: {
        visible: 'border border-[var(--copper)]/20 shadow-md hover:shadow-lg',
        hidden: 'border-2 border-dashed border-[var(--copper)]/40 bg-transparent',
        rolling: 'animate-shake border border-[var(--copper)]/30 shadow-lg',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'visible',
    },
  }
);

export interface DiceProps extends VariantProps<typeof diceVariants> {
  value?: 1 | 2 | 3 | 4 | 5 | 6;
  isHidden?: boolean;
  isRolling?: boolean;
  onRollComplete?: (value: number) => void;
  className?: string;
  onClick?: () => void;
}

// Pixel-perfect positioning configuration for each size
const SIZE_CONFIGS = {
  xs: {
    displaySize: 24,
    bgSizeWidth: 91,
    bgSizeHeight: 63,
    positions: {
      1: { x: -8.5, y: -7.5 },
      2: { x: -34.5, y: -7.5 },
      3: { x: -61, y: -7.5 },
      4: { x: -8.5, y: -34 },
      5: { x: -35, y: -34 },
      6: { x: -61.5, y: -34 }
    },
    borderRadius: 4
  },
  sm: {
    displaySize: 32,
    bgSizeWidth: 121,
    bgSizeHeight: 85,
    positions: {
      1: { x: -11, y: -10 },
      2: { x: -45.5, y: -9.5 },
      3: { x: -80.5, y: -9.5 },
      4: { x: -10.5, y: -45 },
      5: { x: -45.5, y: -45 },
      6: { x: -80.5, y: -45 }
    },
    borderRadius: 6
  },
  md: {
    displaySize: 48,
    bgSizeWidth: 187,
    bgSizeHeight: 132,
    positions: {
      1: { x: -16.5, y: -15 },
      2: { x: -70.5, y: -15 },
      3: { x: -124.5, y: -15 },
      4: { x: -16.5, y: -70 },
      5: { x: -70.5, y: -70 },
      6: { x: -124.5, y: -70 }
    },
    borderRadius: 8
  },
  lg: {
    displaySize: 64,
    bgSizeWidth: 254,
    bgSizeHeight: 176,
    positions: {
      1: { x: -23.5, y: -20.5 },
      2: { x: -96, y: -20.5 },
      3: { x: -169.5, y: -20.5 },
      4: { x: -22.5, y: -94 },
      5: { x: -96, y: -94 },
      6: { x: -169.5, y: -94 }
    },
    borderRadius: 10
  },
  xl: {
    displaySize: 80,
    bgSizeWidth: 315,
    bgSizeHeight: 221,
    positions: {
      1: { x: -27.5, y: -25 },
      2: { x: -118.5, y: -25 },
      3: { x: -209.5, y: -25 },
      4: { x: -27.5, y: -117 },
      5: { x: -118.5, y: -117 },
      6: { x: -209.5, y: -117 }
    },
    borderRadius: 14
  }
} as const;

export function Dice({
  value = 1,
  size = 'md',
  isHidden = false,
  isRolling = false,
  onRollComplete,
  className,
  onClick,
}: DiceProps) {
  const [currentFace, setCurrentFace] = useState(value);
  const [animatingRoll, setAnimatingRoll] = useState(false);

  useEffect(() => {
    if (isRolling && !animatingRoll) {
      setAnimatingRoll(true);
      performRollAnimation();
    } else if (!isRolling && animatingRoll) {
      setAnimatingRoll(false);
    }
  }, [isRolling]);

  useEffect(() => {
    if (!animatingRoll && !isRolling) {
      setCurrentFace(value);
    }
  }, [value, animatingRoll, isRolling]);

  const performRollAnimation = () => {
    const finalValue = Math.floor(Math.random() * 6) + 1 as 1 | 2 | 3 | 4 | 5 | 6;
    const animationDuration = 1800;
    const startTime = Date.now();

    // Animation timing phases
    const phases = [
      { duration: 600, interval: 80 },   // Fast (0-0.6s)
      { duration: 600, interval: 120 },  // Medium (0.6-1.2s)
      { duration: 400, interval: 200 },  // Slow (1.2-1.6s)
      { duration: 200, interval: 0 },    // Landing (1.6-1.8s)
    ];

    let currentPhaseIndex = 0;
    let phaseStartTime = startTime;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const phaseElapsed = Date.now() - phaseStartTime;

      if (elapsed < animationDuration - 200) {
        // Check if we need to move to next phase
        if (currentPhaseIndex < phases.length - 1 && 
            phaseElapsed >= phases[currentPhaseIndex].duration) {
          currentPhaseIndex++;
          phaseStartTime = Date.now();
        }

        // Change face randomly during animation phases
        if (phases[currentPhaseIndex].interval > 0) {
          const randomFace = Math.floor(Math.random() * 6) + 1 as 1 | 2 | 3 | 4 | 5 | 6;
          setCurrentFace(randomFace);
          setTimeout(animate, phases[currentPhaseIndex].interval);
        } else {
          // Final landing phase
          setCurrentFace(finalValue);
          setTimeout(() => {
            setAnimatingRoll(false);
            if (onRollComplete) {
              onRollComplete(finalValue);
            }
          }, 200);
        }
      } else {
        // Animation complete
        setCurrentFace(finalValue);
        setAnimatingRoll(false);
        if (onRollComplete) {
          onRollComplete(finalValue);
        }
      }
    };

    animate();
  };

  const state = animatingRoll || isRolling ? 'rolling' : isHidden ? 'hidden' : 'visible';
  
  // Get the configuration for the current size
  const config = SIZE_CONFIGS[size || 'md'];
  const position = config.positions[currentFace as keyof typeof config.positions];

  return (
    <div
      className={cn(
        diceVariants({ size, state }),
        animatingRoll && 'dice-rolling',
        className
      )}
      onClick={onClick}
      style={{
        borderRadius: `${config.borderRadius}px`,
        backgroundImage: isHidden ? 'none' : `url('/src/assets/dice_sprites.png')`,
        backgroundSize: `${config.bgSizeWidth}px ${config.bgSizeHeight}px`,
        backgroundPosition: isHidden ? 'center' : `${position.x}px ${position.y}px`,
        backgroundRepeat: 'no-repeat',
      }}
    >
      {isHidden && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-2 bg-[var(--copper)]/30 rounded-full" />
        </div>
      )}
      {animatingRoll && (
        <div 
          className="absolute inset-0 pointer-events-none animate-pulse"
          style={{
            borderRadius: `${config.borderRadius}px`,
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.4), inset 0 0 10px rgba(255, 215, 0, 0.2)',
          }}
        />
      )}
    </div>
  );
}

// Specialized wrapper for multiple dice display
export function DiceGroup({
  dice,
  size = 'sm',
  className,
}: {
  dice: Array<{ value?: 1 | 2 | 3 | 4 | 5 | 6; isHidden?: boolean }>;
  size?: DiceProps['size'];
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {dice.map((die, index) => (
        <Dice
          key={index}
          value={die.value}
          isHidden={die.isHidden}
          size={size}
        />
      ))}
    </div>
  );
}