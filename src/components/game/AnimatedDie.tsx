import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import diceSprites from '@/assets/dice_sprites.png';

interface AnimatedDieProps {
  value: number;
  isRolling?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onRollComplete?: (value: number) => void;
}

const AnimatedDie = ({ 
  value, 
  isRolling = false, 
  size = 'md',
  className,
  onRollComplete 
}: AnimatedDieProps) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: { die: 32, sprite: 64 },
    md: { die: 48, sprite: 96 },
    lg: { die: 64, sprite: 128 }
  };

  const { die: dieSize, sprite: spriteSize } = sizeConfig[size];

  useEffect(() => {
    if (isRolling && !isAnimating) {
      setIsAnimating(true);
      
      // Animate through random die faces
      const animationDuration = 1200;
      const frameCount = 12;
      const frameDelay = animationDuration / frameCount;
      
      let frame = 0;
      const interval = setInterval(() => {
        // Show random die faces during animation
        setCurrentValue(Math.floor(Math.random() * 6) + 1);
        frame++;
        
        if (frame >= frameCount) {
          clearInterval(interval);
          // Set final value
          const finalValue = Math.floor(Math.random() * 6) + 1;
          setCurrentValue(finalValue);
          setIsAnimating(false);
          onRollComplete?.(finalValue);
        }
      }, frameDelay);

      return () => clearInterval(interval);
    } else if (!isRolling) {
      setCurrentValue(value);
    }
  }, [isRolling, value, isAnimating, onRollComplete]);

  // Calculate sprite position based on die value
  // Assuming sprites are arranged horizontally in order 1-6
  const spritePosition = (currentValue - 1) * spriteSize;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg shadow-lg transition-all',
        'bg-gradient-to-br from-[var(--copper)] to-[#8B4513]',
        isAnimating && 'animate-bounce',
        className
      )}
      style={{
        width: `${dieSize}px`,
        height: `${dieSize}px`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${diceSprites})`,
          backgroundPosition: `-${spritePosition}px 0`,
          backgroundSize: `${spriteSize * 6}px ${spriteSize}px`,
          imageRendering: 'crisp-edges',
          transform: 'scale(0.5)',
          transformOrigin: 'top left',
          width: `${spriteSize}px`,
          height: `${spriteSize}px`,
        }}
      />
      
      {/* Overlay for depth effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      
      {/* Highlight for 3D effect */}
      <div className="absolute top-0.5 left-0.5 right-1 h-1 bg-white/20 rounded-sm pointer-events-none" />
      <div className="absolute top-0.5 left-0.5 bottom-1 w-1 bg-white/10 rounded-sm pointer-events-none" />
    </div>
  );
};

export default AnimatedDie;