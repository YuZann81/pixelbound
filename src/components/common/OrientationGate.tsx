import React, { useEffect, useState } from 'react';
import { Smartphone, RotateCw } from 'lucide-react';

export const OrientationGate: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if height > width and width is mobile/tablet size (< 900px)
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 900;
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-stone-950 flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
      {/* Subtle border framing */}
      <div className="relative max-w-sm p-8 bg-stone-900/90 rounded-2xl border-2 border-stone-800 shadow-2xl flex flex-col items-center space-y-5">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <Smartphone className="w-14 h-14 text-stone-400 rotate-90 animate-pulse" />
          <RotateCw className="w-8 h-8 text-amber-400 absolute top-0 right-0 animate-spin" />
        </div>

        <div className="space-y-2">
          <h2 className="font-medieval text-xl font-bold tracking-wider text-amber-300 uppercase">
            Rotate Your Device
          </h2>
          <p className="font-pixel text-xs text-stone-200 tracking-wide">
            PIXEL BOUND IS DESIGNED FOR LANDSCAPE PLAY.
          </p>
          <p className="font-flavor text-xs text-stone-400 mt-2 leading-relaxed">
            Please rotate your device horizontally to experience the battlefield and tactical formations.
          </p>
        </div>
      </div>
    </div>
  );
};
