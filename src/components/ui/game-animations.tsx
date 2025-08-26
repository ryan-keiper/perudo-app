import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Dice } from './dice';

// ============================================================================
// DUDO ANIMATION - Challenge callout with dramatic effect
// ============================================================================

interface DudoAnimationProps {
  isVisible: boolean;
  playerName: string;
  onComplete?: () => void;
  duration?: number;
}

export function DudoAnimation({ 
  isVisible, 
  playerName, 
  onComplete, 
  duration = 3000 
}: DudoAnimationProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit' | 'hidden'>('hidden');
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (isVisible && phase === 'hidden') {
      // Generate explosion particles
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 200,
      }));
      setParticles(newParticles);
      
      setPhase('enter');
      
      const timeline = setTimeout(() => setPhase('hold'), 500);
      const holdTimer = setTimeout(() => setPhase('exit'), duration - 800);
      const exitTimer = setTimeout(() => {
        setPhase('hidden');
        onComplete?.();
      }, duration);

      return () => {
        clearTimeout(timeline);
        clearTimeout(holdTimer);
        clearTimeout(exitTimer);
      };
    }
  }, [isVisible, phase, duration, onComplete]);

  if (!isVisible && phase === 'hidden') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/60 transition-opacity duration-500",
          phase === 'enter' ? 'opacity-100' : phase === 'exit' ? 'opacity-0' : 'opacity-100'
        )}
      />

      {/* Main DUDO text */}
      <div 
        className={cn(
          "relative text-8xl md:text-9xl font-black text-red-500 transition-all duration-500",
          "drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-pulse",
          phase === 'enter' 
            ? 'scale-100 rotate-0 opacity-100' 
            : phase === 'exit' 
            ? 'scale-110 rotate-3 opacity-0' 
            : 'scale-105 rotate-1'
        )}
        style={{
          textShadow: '0 0 20px #ef4444, 0 0 40px #dc2626, 0 0 60px #991b1b',
          WebkitTextStroke: '3px #7f1d1d',
        }}
      >
        DUDO!
      </div>

      {/* Player name subtitle */}
      <div 
        className={cn(
          "absolute top-3/4 text-2xl md:text-3xl font-bold text-[var(--accent)] transition-all duration-700 delay-200",
          "drop-shadow-lg animate-bounce",
          phase === 'enter' || phase === 'hold' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        {playerName} challenges!
      </div>

      {/* Explosion particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={cn(
            "absolute w-3 h-3 bg-red-400 rounded-full transition-all duration-1000 ease-out",
            phase === 'enter' || phase === 'hold' ? 'animate-ping' : ''
          )}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}ms`,
            transform: phase === 'enter' || phase === 'hold' 
              ? 'translate(0, 0) scale(1)' 
              : 'translate(200px, 200px) scale(0)',
          }}
        />
      ))}

      {/* Sword slash effects */}
      <div 
        className={cn(
          "absolute inset-0 transition-all duration-300",
          phase === 'enter' ? 'animate-slash-right' : ''
        )}
      >
        <div className="absolute top-1/4 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent transform rotate-12 opacity-80" />
      </div>
      <div 
        className={cn(
          "absolute inset-0 transition-all duration-300 delay-100",
          phase === 'enter' ? 'animate-slash-left' : ''
        )}
      >
        <div className="absolute bottom-1/4 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-400 to-transparent transform -rotate-12 opacity-80" />
      </div>
    </div>
  );
}

// ============================================================================
// CALZA ANIMATION - Celebration for exact match
// ============================================================================

interface CalzaAnimationProps {
  isVisible: boolean;
  playerName: string;
  onComplete?: () => void;
  duration?: number;
}

export function CalzaAnimation({ 
  isVisible, 
  playerName, 
  onComplete, 
  duration = 4000 
}: CalzaAnimationProps) {
  const [phase, setPhase] = useState<'enter' | 'celebrate' | 'exit' | 'hidden'>('hidden');
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number; rotation: number }>>([]);
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (isVisible && phase === 'hidden') {
      // Generate confetti
      const newConfetti = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10 + Math.random() * 20,
        color: ['#fbbf24', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'][Math.floor(Math.random() * 5)],
        delay: Math.random() * 1000,
        rotation: Math.random() * 360,
      }));
      
      // Generate sparkles
      const newSparkles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: 30 + Math.random() * 40,
        y: 30 + Math.random() * 40,
        delay: Math.random() * 500,
      }));

      setConfetti(newConfetti);
      setSparkles(newSparkles);
      setPhase('enter');
      
      const celebrateTimer = setTimeout(() => setPhase('celebrate'), 800);
      const exitTimer = setTimeout(() => setPhase('exit'), duration - 800);
      const completeTimer = setTimeout(() => {
        setPhase('hidden');
        onComplete?.();
      }, duration);

      return () => {
        clearTimeout(celebrateTimer);
        clearTimeout(exitTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, phase, duration, onComplete]);

  if (!isVisible && phase === 'hidden') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop with gold glow */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-radial from-yellow-900/30 via-transparent to-transparent transition-opacity duration-1000",
          phase === 'enter' || phase === 'celebrate' ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Main CALZA text with treasure chest effect */}
      <div className="relative">
        <div 
          className={cn(
            "text-7xl md:text-8xl font-black text-[var(--accent)] transition-all duration-800",
            "drop-shadow-[0_0_40px_rgba(251,191,36,0.9)]",
            phase === 'enter' 
              ? 'scale-100 rotate-0 opacity-100' 
              : phase === 'exit' 
              ? 'scale-125 rotate-2 opacity-0' 
              : 'scale-110 animate-bounce-gentle'
          )}
          style={{
            textShadow: '0 0 30px #fbbf24, 0 0 60px #f59e0b, 0 0 90px #d97706',
            WebkitTextStroke: '4px #92400e',
          }}
        >
          CALZA!
        </div>

        {/* Treasure sparkles around text */}
        {sparkles.map((sparkle) => (
          <div
            key={sparkle.id}
            className={cn(
              "absolute w-2 h-2 bg-yellow-300 rounded-full animate-twinkle",
              phase === 'enter' || phase === 'celebrate' ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
              animationDelay: `${sparkle.delay}ms`,
            }}
          />
        ))}
      </div>

      {/* Player name with crown effect */}
      <div 
        className={cn(
          "absolute top-2/3 text-2xl md:text-3xl font-bold text-[var(--success)] transition-all duration-1000 delay-300",
          "drop-shadow-lg",
          phase === 'enter' || phase === 'celebrate' ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90'
        )}
      >
        👑 {playerName} called it perfectly! 👑
      </div>

      {/* Confetti rain */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className={cn(
            "absolute w-3 h-3 transition-all duration-3000 ease-out",
            phase === 'enter' || phase === 'celebrate' ? 'animate-confetti-fall' : ''
          )}
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}ms`,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}

      {/* Golden coins effect */}
      <div 
        className={cn(
          "absolute bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-2 transition-all duration-1000 delay-500",
          phase === 'celebrate' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        {[1, 2, 3].map((coin) => (
          <div
            key={coin}
            className="w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full animate-coin-flip shadow-lg"
            style={{ animationDelay: `${coin * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COUNTDOWN TIMER - Dramatic 3-2-1 countdown
// ============================================================================

interface CountdownTimerProps {
  isVisible: boolean;
  onComplete?: () => void;
  duration?: number;
}

export function CountdownTimer({ 
  isVisible, 
  onComplete, 
  duration = 3500 
}: CountdownTimerProps) {
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [phase, setPhase] = useState<'hidden' | 'counting' | 'go' | 'complete'>('hidden');

  useEffect(() => {
    if (isVisible && phase === 'hidden') {
      setPhase('counting');
      setCurrentNumber(3);

      // Count down sequence
      const timers = [
        setTimeout(() => setCurrentNumber(2), 1000),
        setTimeout(() => setCurrentNumber(1), 2000),
        setTimeout(() => {
          setCurrentNumber(null);
          setPhase('go');
        }, 3000),
        setTimeout(() => {
          setPhase('complete');
          onComplete?.();
        }, duration),
      ];

      return () => timers.forEach(clearTimeout);
    }
  }, [isVisible, phase, duration, onComplete]);

  if (!isVisible || phase === 'hidden' || phase === 'complete') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Pulsing backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/70 transition-all duration-300",
          currentNumber === 1 ? 'bg-red-900/60' : 'bg-black/70'
        )}
      />

      {/* Countdown numbers */}
      {currentNumber && (
        <div 
          className={cn(
            "text-9xl md:text-[12rem] font-black text-white transition-all duration-200",
            "drop-shadow-[0_0_50px_rgba(255,255,255,0.8)] animate-countdown-pulse",
            currentNumber === 1 ? 'text-red-400 animate-urgent-pulse' : 'text-white'
          )}
          style={{
            textShadow: currentNumber === 1 
              ? '0 0 40px #ef4444, 0 0 80px #dc2626' 
              : '0 0 40px #ffffff, 0 0 80px #e5e7eb',
            WebkitTextStroke: '3px #1f2937',
          }}
        >
          {currentNumber}
        </div>
      )}

      {/* "REVEAL!" text */}
      {phase === 'go' && (
        <div 
          className={cn(
            "text-6xl md:text-8xl font-black text-[var(--accent)] animate-reveal-burst",
            "drop-shadow-[0_0_40px_rgba(251,191,36,0.9)]"
          )}
          style={{
            textShadow: '0 0 30px #fbbf24, 0 0 60px #f59e0b',
            WebkitTextStroke: '3px #92400e',
          }}
        >
          REVEAL!
        </div>
      )}

      {/* Tension particles */}
      {currentNumber && (
        <div className="absolute inset-0">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-2 h-2 bg-white rounded-full animate-tension-spark",
                currentNumber === 1 ? 'bg-red-400' : 'bg-white'
              )}
              style={{
                left: `${20 + i * 12}%`,
                top: `${30 + Math.sin(i) * 20}%`,
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DICE REVEAL ANIMATION - Simultaneous reveal of all dice
// ============================================================================

interface PlayerDiceData {
  playerId: string;
  playerName: string;
  dice: Array<{ value: 1 | 2 | 3 | 4 | 5 | 6 }>;
  position: { x: number; y: number }; // Position on screen for animation
}

interface DiceRevealAnimationProps {
  isVisible: boolean;
  players: PlayerDiceData[];
  onComplete?: () => void;
  duration?: number;
}

export function DiceRevealAnimation({ 
  isVisible, 
  players, 
  onComplete, 
  duration = 3000 
}: DiceRevealAnimationProps) {
  const [phase, setPhase] = useState<'hidden' | 'gather' | 'reveal' | 'complete'>('hidden');
  const [revealedPlayers, setRevealedPlayers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isVisible && phase === 'hidden') {
      setPhase('gather');
      setRevealedPlayers(new Set());

      // Staggered reveal sequence
      const gatherTimer = setTimeout(() => setPhase('reveal'), 800);
      
      // Reveal each player's dice with stagger
      const revealTimers = players.map((player, index) => 
        setTimeout(() => {
          setRevealedPlayers(prev => new Set([...prev, player.playerId]));
        }, 1200 + index * 200)
      );

      const completeTimer = setTimeout(() => {
        setPhase('complete');
        onComplete?.();
      }, duration);

      return () => {
        clearTimeout(gatherTimer);
        revealTimers.forEach(clearTimeout);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, phase, players, duration, onComplete]);

  if (!isVisible || phase === 'hidden' || phase === 'complete') return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Central reveal area */}
      <div className="relative w-full max-w-6xl p-8">
        <div 
          className={cn(
            "text-center mb-8 transition-all duration-1000",
            phase === 'reveal' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <h2 className="text-4xl font-bold text-white drop-shadow-lg">
            ⚔️ The Dice Are Cast! ⚔️
          </h2>
        </div>

        {/* Player dice reveals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player, index) => {
            const isRevealed = revealedPlayers.has(player.playerId);
            
            return (
              <div
                key={player.playerId}
                className={cn(
                  "bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20 transition-all duration-800",
                  phase === 'gather' 
                    ? 'opacity-60 scale-95 translate-y-8' 
                    : isRevealed
                    ? 'opacity-100 scale-100 translate-y-0 shadow-xl shadow-[var(--accent)]/20'
                    : 'opacity-60 scale-95'
                )}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Player name */}
                <div className="text-center mb-3">
                  <h3 className="text-lg font-semibold text-white">
                    {player.playerName}
                  </h3>
                </div>

                {/* Dice container */}
                <div className="flex justify-center items-center gap-2 min-h-[60px]">
                  {player.dice.map((die, dieIndex) => (
                    <div
                      key={dieIndex}
                      className={cn(
                        "transition-all duration-500",
                        isRevealed
                          ? 'opacity-100 scale-100 animate-dice-bounce'
                          : 'opacity-0 scale-50'
                      )}
                      style={{
                        animationDelay: `${dieIndex * 100}ms`,
                      }}
                    >
                      <Dice
                        value={die.value}
                        size="lg"
                        isHidden={!isRevealed}
                      />
                    </div>
                  ))}
                </div>

                {/* Magic sparkles for revealed dice */}
                {isRevealed && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(4)].map((_, sparkleIndex) => (
                      <div
                        key={sparkleIndex}
                        className="absolute w-1 h-1 bg-[var(--accent)] rounded-full animate-sparkle-float"
                        style={{
                          left: `${20 + sparkleIndex * 20}%`,
                          top: `${10 + sparkleIndex * 15}%`,
                          animationDelay: `${sparkleIndex * 200}ms`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ROUND RESULT DISPLAY - Victory/defeat fanfare
// ============================================================================

interface RoundResultDisplayProps {
  isVisible: boolean;
  result: {
    type: 'dudo_correct' | 'dudo_incorrect' | 'calza_success' | 'round_complete';
    winner?: string;
    loser?: string;
    message: string;
  };
  onComplete?: () => void;
  duration?: number;
}

export function RoundResultDisplay({ 
  isVisible, 
  result, 
  onComplete, 
  duration = 4000 
}: RoundResultDisplayProps) {
  const [phase, setPhase] = useState<'hidden' | 'enter' | 'celebrate' | 'exit' | 'complete'>('hidden');
  const [fireworks, setFireworks] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);

  const isVictory = result.type === 'calza_success' || result.type === 'dudo_correct';
  const isDefeat = result.type === 'dudo_incorrect';

  useEffect(() => {
    if (isVisible && phase === 'hidden') {
      if (isVictory) {
        // Generate fireworks for victory
        const newFireworks = Array.from({ length: 15 }, (_, i) => ({
          id: i,
          x: 10 + Math.random() * 80,
          y: 10 + Math.random() * 60,
          color: ['#fbbf24', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
          delay: Math.random() * 1500,
        }));
        setFireworks(newFireworks);
      }

      setPhase('enter');
      
      const celebrateTimer = setTimeout(() => setPhase('celebrate'), 600);
      const exitTimer = setTimeout(() => setPhase('exit'), duration - 800);
      const completeTimer = setTimeout(() => {
        setPhase('complete');
        onComplete?.();
      }, duration);

      return () => {
        clearTimeout(celebrateTimer);
        clearTimeout(exitTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, phase, isVictory, duration, onComplete]);

  if (!isVisible || phase === 'hidden' || phase === 'complete') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop with appropriate mood */}
      <div 
        className={cn(
          "absolute inset-0 transition-all duration-1000",
          isVictory 
            ? 'bg-gradient-radial from-green-900/40 via-transparent to-transparent'
            : isDefeat
            ? 'bg-gradient-radial from-red-900/40 via-transparent to-transparent'
            : 'bg-black/50'
        )}
      />

      {/* Main result container */}
      <div 
        className={cn(
          "relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-md mx-4 transition-all duration-800",
          "shadow-2xl",
          phase === 'enter' 
            ? 'opacity-100 scale-100 translate-y-0' 
            : phase === 'exit'
            ? 'opacity-0 scale-110 translate-y-4'
            : 'opacity-100 scale-105'
        )}
      >
        {/* Result icon/emoji */}
        <div className="text-center mb-4">
          <div 
            className={cn(
              "text-6xl transition-all duration-500",
              phase === 'celebrate' ? 'animate-bounce' : ''
            )}
          >
            {isVictory ? '🏆' : isDefeat ? '💀' : '⚡'}
          </div>
        </div>

        {/* Winner/Loser text */}
        {result.winner && (
          <div 
            className={cn(
              "text-center mb-2 transition-all duration-700 delay-300",
              phase === 'enter' || phase === 'celebrate' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <h3 className="text-2xl font-bold text-[var(--success)]">
              🎉 {result.winner} Wins! 🎉
            </h3>
          </div>
        )}

        {result.loser && (
          <div 
            className={cn(
              "text-center mb-2 transition-all duration-700 delay-300",
              phase === 'enter' || phase === 'celebrate' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <h3 className="text-xl font-semibold text-red-400">
              💔 {result.loser} loses a die
            </h3>
          </div>
        )}

        {/* Result message */}
        <div 
          className={cn(
            "text-center transition-all duration-700 delay-500",
            phase === 'enter' || phase === 'celebrate' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <p className="text-white text-lg font-medium leading-relaxed">
            {result.message}
          </p>
        </div>

        {/* Decorative elements based on result type */}
        {isVictory && (
          <div className="absolute -top-2 -left-2 w-full h-full pointer-events-none">
            <div className="absolute top-4 right-4 text-2xl animate-spin-slow">⭐</div>
            <div className="absolute bottom-4 left-4 text-2xl animate-bounce-slow">✨</div>
            <div className="absolute top-1/2 right-2 text-xl animate-pulse">🌟</div>
          </div>
        )}

        {isDefeat && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 right-2 text-xl animate-float">⚡</div>
            <div className="absolute bottom-2 left-2 text-xl animate-float delay-300">💥</div>
          </div>
        )}
      </div>

      {/* Victory fireworks */}
      {isVictory && fireworks.map((firework) => (
        <div
          key={firework.id}
          className={cn(
            "absolute w-4 h-4 rounded-full transition-all duration-2000 ease-out animate-firework",
            phase === 'celebrate' ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            left: `${firework.x}%`,
            top: `${firework.y}%`,
            backgroundColor: firework.color,
            animationDelay: `${firework.delay}ms`,
            boxShadow: `0 0 20px ${firework.color}`,
          }}
        />
      ))}

      {/* Defeat smoke effect */}
      {isDefeat && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-12 h-12 bg-gray-600/30 rounded-full animate-smoke-rise",
                phase === 'celebrate' ? 'opacity-60' : 'opacity-0'
              )}
              style={{
                left: `${20 + i * 10}%`,
                top: `${60 + Math.random() * 20}%`,
                animationDelay: `${i * 200}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CSS-in-JS ANIMATIONS (to be added to your CSS file)
// ============================================================================

/*
Add these keyframes to your src/index.css file:

@keyframes slash-right {
  0% { transform: translateX(-100%) rotate(12deg) scaleX(0); }
  50% { transform: translateX(0) rotate(12deg) scaleX(1); }
  100% { transform: translateX(100%) rotate(12deg) scaleX(0); }
}

@keyframes slash-left {
  0% { transform: translateX(100%) rotate(-12deg) scaleX(0); }
  50% { transform: translateX(0) rotate(-12deg) scaleX(1); }
  100% { transform: translateX(-100%) rotate(-12deg) scaleX(0); }
}

@keyframes confetti-fall {
  0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
}

@keyframes coin-flip {
  0%, 100% { transform: rotateY(0deg); }
  50% { transform: rotateY(180deg); }
}

@keyframes countdown-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes urgent-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  25% { transform: scale(1.05); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
  75% { transform: scale(1.05); opacity: 0.8; }
}

@keyframes reveal-burst {
  0% { transform: scale(0) rotate(-180deg); opacity: 0; }
  50% { transform: scale(1.2) rotate(0deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

@keyframes tension-spark {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes dice-bounce {
  0% { transform: translateY(-20px) scale(0.8); opacity: 0; }
  50% { transform: translateY(-5px) scale(1.1); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes sparkle-float {
  0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0; }
  50% { transform: translateY(-10px) rotate(180deg); opacity: 1; }
}

@keyframes twinkle {
  0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
  50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
}

@keyframes bounce-gentle {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-10px) scale(1.05); }
}

@keyframes firework {
  0% { transform: scale(0.5); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.8; }
  100% { transform: scale(2); opacity: 0; }
}

@keyframes smoke-rise {
  0% { transform: translateY(0px) scale(0.5); opacity: 0.6; }
  100% { transform: translateY(-100px) scale(2); opacity: 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

.animate-slash-right { animation: slash-right 0.3s ease-out; }
.animate-slash-left { animation: slash-left 0.3s ease-out; }
.animate-confetti-fall { animation: confetti-fall 3s ease-out forwards; }
.animate-coin-flip { animation: coin-flip 2s ease-in-out infinite; }
.animate-countdown-pulse { animation: countdown-pulse 1s ease-in-out; }
.animate-urgent-pulse { animation: urgent-pulse 0.5s ease-in-out infinite; }
.animate-reveal-burst { animation: reveal-burst 0.8s ease-out; }
.animate-tension-spark { animation: tension-spark 1.5s ease-in-out infinite; }
.animate-dice-bounce { animation: dice-bounce 0.6s ease-out; }
.animate-sparkle-float { animation: sparkle-float 2s ease-in-out infinite; }
.animate-twinkle { animation: twinkle 1.5s ease-in-out infinite; }
.animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }
.animate-firework { animation: firework 1.5s ease-out; }
.animate-smoke-rise { animation: smoke-rise 3s ease-out forwards; }
.animate-float { animation: float 3s ease-in-out infinite; }
.animate-spin-slow { animation: spin-slow 8s linear infinite; }
.animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
*/

// ============================================================================
// VICTORY ANNOUNCEMENT - Game ending celebration
// ============================================================================

interface VictoryAnnouncementProps {
  isVisible: boolean;
  winner: string;
  winnerAvatar?: string;
  winMethod?: 'seven_dice' | 'seven_calzas' | 'last_standing';
  isWinner: boolean;
  onNavigateToHub?: () => void;
  countdownSeconds?: number;
}

export function VictoryAnnouncement({
  isVisible,
  winner,
  winnerAvatar = '🏴‍☠️',
  winMethod = 'last_standing',
  isWinner,
  onNavigateToHub,
  countdownSeconds = 10
}: VictoryAnnouncementProps) {
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (!isVisible) return;

    // Generate confetti
    if (isWinner) {
      const newConfetti = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: ['#fbbf24', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#f97316'][Math.floor(Math.random() * 6)],
        delay: Math.random() * 2
      }));
      setConfetti(newConfetti);
    }

    // Start countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onNavigateToHub?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, isWinner, onNavigateToHub]);

  if (!isVisible) return null;

  const winMethodDisplay = {
    seven_dice: { icon: '🎲', text: 'Seven Dice Victory!' },
    seven_calzas: { icon: '🎯', text: 'Seven Calzas Victory!' },
    last_standing: { icon: '👑', text: 'Last One Standing!' }
  };

  const methodInfo = winMethodDisplay[winMethod];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Background overlay */}
      <div 
        className={cn(
          "absolute inset-0 transition-opacity duration-1000",
          isWinner 
            ? "bg-gradient-to-br from-yellow-900/80 via-amber-900/70 to-orange-900/80"
            : "bg-gradient-to-br from-gray-900/90 via-slate-900/85 to-zinc-900/90"
        )}
      />

      {/* Confetti for winner */}
      {isWinner && confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 animate-confetti-fall"
          style={{
            left: `${piece.x}%`,
            top: '-10px',
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            transform: `rotate(${Math.random() * 360}deg)`
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 text-center px-6 animate-enter-scale">
        {/* Trophy or Skull */}
        <div className="mb-6 animate-trophy-bounce">
          <div className="text-8xl inline-block">
            {isWinner ? '🏆' : '💀'}
          </div>
        </div>

        {/* Victory/Defeat text */}
        <h1 
          className={cn(
            "text-5xl font-bold mb-4",
            isWinner 
              ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-300"
              : "text-gray-400"
          )}
        >
          {isWinner ? 'VICTORY!' : 'DEFEAT'}
        </h1>

        {/* Winner announcement */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-4xl">{winnerAvatar}</span>
            <h2 className="text-3xl font-bold text-white">
              {winner} Wins!
            </h2>
          </div>
          
          {/* Win method */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-3xl">{methodInfo.icon}</span>
            <p className="text-xl text-gray-200">{methodInfo.text}</p>
          </div>
        </div>

        {/* Countdown and button */}
        <div className="mt-8 space-y-4">
          <p className="text-gray-300">
            Returning to hub in {countdown} seconds...
          </p>
          <button
            onClick={onNavigateToHub}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Return to Hub
          </button>
        </div>
      </div>

      {/* Additional decorations */}
      {isWinner && (
        <>
          <div className="absolute top-10 left-10 text-6xl animate-crown-float">✨</div>
          <div className="absolute top-20 right-20 text-5xl animate-bounce-slow">🌟</div>
          <div className="absolute bottom-20 left-20 text-5xl animate-spin-slow">⭐</div>
          <div className="absolute bottom-10 right-10 text-6xl animate-float">🎉</div>
        </>
      )}
    </div>
  );
}