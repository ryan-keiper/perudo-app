import { useState, useEffect } from 'react';
import comingSoonBg from '@/assets/coming_soon_page.jpg';

const ComingSoon = () => {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Target date: August 25, 2025, 8:00 PM Eastern Time
    // Eastern Time is UTC-4 in summer (EDT)
    const targetDate = new Date('2025-08-25T20:00:00-04:00');

    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeRemaining({ days, hours, minutes, seconds });
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center relative"
      style={{
        backgroundImage: `url(${comingSoonBg})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#000'
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4">
        <h1 className="text-5xl sm:text-7xl font-bold mb-8 drop-shadow-2xl">
          Coming Soon
        </h1>
        
        {/* Countdown Timer */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
          <div className="flex flex-col items-center">
            <div className="text-4xl sm:text-6xl font-bold tabular-nums drop-shadow-lg">
              {String(timeRemaining.days).padStart(2, '0')}
            </div>
            <div className="text-sm sm:text-base uppercase tracking-wider mt-2 drop-shadow">
              {timeRemaining.days === 1 ? 'Day' : 'Days'}
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-4xl sm:text-6xl font-bold tabular-nums drop-shadow-lg">
              {String(timeRemaining.hours).padStart(2, '0')}
            </div>
            <div className="text-sm sm:text-base uppercase tracking-wider mt-2 drop-shadow">
              {timeRemaining.hours === 1 ? 'Hour' : 'Hours'}
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-4xl sm:text-6xl font-bold tabular-nums drop-shadow-lg">
              {String(timeRemaining.minutes).padStart(2, '0')}
            </div>
            <div className="text-sm sm:text-base uppercase tracking-wider mt-2 drop-shadow">
              {timeRemaining.minutes === 1 ? 'Minute' : 'Minutes'}
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-4xl sm:text-6xl font-bold tabular-nums drop-shadow-lg">
              {String(timeRemaining.seconds).padStart(2, '0')}
            </div>
            <div className="text-sm sm:text-base uppercase tracking-wider mt-2 drop-shadow">
              {timeRemaining.seconds === 1 ? 'Second' : 'Seconds'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;