import { useState, useEffect } from 'react';
import '../index.css'

const Countdown = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const distance = targetDate - new Date().getTime();
    if (distance < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000),
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="grid grid-flow-col gap-5 text-center auto-cols-max">
      <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
        {/* Renderizamos el número directamente dentro del span */}
        <span className="font-mono text-5xl">{timeLeft.days}</span>
        days
      </div>
      <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
        <span className="font-mono text-5xl">
          {timeLeft.hours < 10 ? `0${timeLeft.hours}` : timeLeft.hours}
        </span>
        hours
      </div>
      <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
        <span className="font-mono text-5xl">
          {timeLeft.minutes < 10 ? `0${timeLeft.minutes}` : timeLeft.minutes}
        </span>
        min
      </div>
      <div className="flex flex-col p-2 bg-neutral rounded-box text-neutral-content">
        <span className="font-mono text-5xl">
          {timeLeft.seconds < 10 ? `0${timeLeft.seconds}` : timeLeft.seconds}
        </span>
        sec
      </div>
    </div>
  );
};

export default Countdown;