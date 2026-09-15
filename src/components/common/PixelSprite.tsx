import React from 'react';
import { HeroDefinition } from '../../types';

interface PixelSpriteProps {
  definition: HeroDefinition;
  state?: 'idle' | 'walking' | 'attacking' | 'casting' | 'hurt' | 'dead';
  facing?: 'left' | 'right';
  size?: number;
  showShadow?: boolean;
}

export const PixelSprite: React.FC<PixelSpriteProps> = ({
  definition,
  state = 'idle',
  facing = 'right',
  size = 56,
  showShadow = true,
}) => {
  const { visualTraits, role, element, colorScheme } = definition;

  // Animation CSS transforms based on state
  let animClass = '';
  if (state === 'idle') {
    animClass = 'animate-pulse';
  } else if (state === 'walking') {
    animClass = 'translate-x-1';
  } else if (state === 'attacking') {
    animClass = facing === 'right' ? 'translate-x-3 scale-105' : '-translate-x-3 scale-105';
  } else if (state === 'casting') {
    animClass = '-translate-y-2 scale-110';
  } else if (state === 'hurt') {
    animClass = facing === 'right' ? '-translate-x-2 brightness-150' : 'translate-x-2 brightness-150';
  } else if (state === 'dead') {
    animClass = 'rotate-90 translate-y-3 opacity-30 grayscale';
  }

  const isFlip = facing === 'left';

  return (
    <div
      className={`relative select-none flex flex-col items-center justify-center transition-transform duration-150 ${animClass}`}
      style={{
        width: size,
        height: size,
        transform: `${isFlip ? 'scaleX(-1)' : 'scaleX(1)'}`,
      }}
    >
      {/* Sprite Cast Shadow */}
      {showShadow && state !== 'dead' && (
        <div
          className="absolute -bottom-1 w-8 h-2.5 rounded-full bg-black/40 blur-[1px] pointer-events-none"
          style={{ transform: isFlip ? 'scaleX(-1)' : 'none' }}
        />
      )}

      {/* 32-bit Styled Pixel Grid SVG Sprite */}
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        className="pixel-crisp drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glow / Elemental Aura when casting */}
        {state === 'casting' && (
          <circle
            cx="16"
            cy="16"
            r="14"
            fill={colorScheme.glow}
            className="animate-ping opacity-75"
          />
        )}

        {/* Cape / Cloak (Back Layer) */}
        {visualTraits.capeColor && (
          <path
            d={
              state === 'walking'
                ? 'M11 12 H7 V25 H13 V18 Z'
                : 'M11 12 H8 V24 H14 V18 Z'
            }
            fill={visualTraits.capeColor}
          />
        )}

        {/* Legs / Boots (Darker armor) */}
        <rect x="12" y="22" width="3" height="6" fill="#18181b" />
        <rect x="17" y="22" width="3" height="6" fill="#18181b" />
        <rect x="11" y="26" width="4" height="3" fill="#27272a" />
        <rect x="17" y="26" width="4" height="3" fill="#27272a" />

        {/* Torso / Body Armor */}
        <rect x="12" y="13" width="8" height="9" fill={visualTraits.armorColor} />
        {/* Armor highlights */}
        <rect x="14" y="14" width="4" height="4" fill={colorScheme.primary} opacity="0.8" />
        <rect x="12" y="20" width="8" height="2" fill="#713f12" /> {/* Belt */}
        <rect x="15" y="20" width="2" height="2" fill="#facc15" /> {/* Belt buckle */}

        {/* Head / Face */}
        <rect x="13" y="6" width="6" height="7" fill="#fbcfe8" /> {/* Skin */}
        {/* Hair */}
        <path
          d="M12 5 H20 V8 H13 V10 H12 Z"
          fill={visualTraits.hairColor}
        />

        {/* Headpiece (Helmet, Hood, Circlet, Halo, Horns) */}
        {visualTraits.headpiece === 'helmet' && (
          <path
            d="M12 4 H20 V10 H18 V8 H14 V10 H12 Z"
            fill="#475569"
          />
        )}
        {visualTraits.headpiece === 'hood' && (
          <path
            d="M11 4 H21 V11 H19 V7 H13 V11 H11 Z"
            fill="#1e1b4b"
          />
        )}
        {visualTraits.headpiece === 'circlet' && (
          <rect x="12" y="7" width="8" height="2" fill="#eab308" />
        )}
        {visualTraits.headpiece === 'crown' && (
          <path
            d="M12 4 L14 7 L16 4 L18 7 L20 4 V8 H12 Z"
            fill="#facc15"
          />
        )}
        {visualTraits.headpiece === 'halo' && (
          <rect x="12" y="2" width="8" height="2" fill="#fef08a" opacity="0.9" />
        )}
        {visualTraits.headpiece === 'horns' && (
          <>
            <rect x="11" y="3" width="2" height="4" fill="#65a30d" />
            <rect x="19" y="3" width="2" height="4" fill="#65a30d" />
          </>
        )}

        {/* Eyes (Pixel) */}
        <rect x="17" y="9" width="2" height="2" fill="#09090b" />
        {state === 'casting' && (
          <rect x="17" y="9" width="2" height="2" fill={colorScheme.accent} />
        )}

        {/* Front Arm & Weapon */}
        {/* Shield in off-hand or weapon */}
        {visualTraits.weaponType === 'shield' && (
          <rect
            x={state === 'attacking' ? 20 : 19}
            y="13"
            width="6"
            height="11"
            fill={visualTraits.weaponColor}
            stroke="#1e293b"
            strokeWidth="1"
          />
        )}

        {visualTraits.weaponType === 'sword' && (
          <g transform={state === 'attacking' ? 'rotate(40 22 16)' : 'none'}>
            <rect x="19" y="14" width="3" height="3" fill={visualTraits.armorColor} />
            <rect x="21" y="8" width="2" height="11" fill={visualTraits.weaponColor} />
            <rect x="19" y="16" width="6" height="2" fill="#facc15" />
          </g>
        )}

        {visualTraits.weaponType === 'daggers' && (
          <g transform={state === 'attacking' ? 'rotate(-25 21 16)' : 'none'}>
            <rect x="19" y="13" width="2" height="7" fill={visualTraits.weaponColor} />
            <rect x="10" y="14" width="2" height="6" fill={visualTraits.weaponColor} />
          </g>
        )}

        {visualTraits.weaponType === 'staff' && (
          <g>
            <rect x="20" y="5" width="2" height="20" fill="#78350f" />
            <circle cx="21" cy="5" r="3" fill={colorScheme.accent} />
            {state === 'casting' && (
              <circle cx="21" cy="5" r="5" fill={colorScheme.primary} opacity="0.6" />
            )}
          </g>
        )}

        {visualTraits.weaponType === 'orb' && (
          <g>
            <circle
              cx="22"
              cy={state === 'casting' ? 10 : 13}
              r="4"
              fill={colorScheme.primary}
              stroke={colorScheme.accent}
              strokeWidth="1"
            />
          </g>
        )}

        {visualTraits.weaponType === 'tome' && (
          <g>
            <rect x="19" y="14" width="6" height="7" fill="#854d0e" stroke="#facc15" strokeWidth="1" />
            <line x1="22" y1="14" x2="22" y2="21" stroke="#451a03" strokeWidth="1" />
          </g>
        )}

        {visualTraits.weaponType === 'spear' && (
          <g transform={state === 'attacking' ? 'rotate(25 22 15)' : 'none'}>
            <rect x="20" y="3" width="2" height="23" fill="#ca8a04" />
            <polygon points="21,1 18,6 24,6" fill="#facc15" />
          </g>
        )}

        {visualTraits.weaponType === 'scythe' && (
          <g transform={state === 'attacking' ? 'rotate(35 20 16)' : 'none'}>
            <rect x="19" y="4" width="2" height="22" fill="#3b0764" />
            <path d="M19 4 C24 2, 27 7, 24 10" stroke="#a855f7" strokeWidth="2" fill="none" />
          </g>
        )}

        {visualTraits.weaponType === 'bow' && (
          <g transform={state === 'attacking' ? 'translate(2, -1) scale(1.1)' : 'none'}>
            {/* Bow curve */}
            <path d="M 21 6 Q 25 15, 21 24" stroke={visualTraits.weaponColor || '#ca8a04'} strokeWidth="2" fill="none" />
            {/* Bowstring */}
            <line x1="21" y1="6" x2={state === 'attacking' ? '18' : '21'} y2={state === 'attacking' ? '15' : '24'} stroke="#e2e8f0" strokeWidth="0.8" />
            {state === 'attacking' && (
              <>
                <line x1="18" y1="15" x2="21" y2="24" stroke="#e2e8f0" strokeWidth="0.8" />
                {/* Arrow nocked */}
                <line x1="16" y1="15" x2="25" y2="15" stroke="#facc15" strokeWidth="1.2" />
                <polygon points="26,15 24,13 24,17" fill="#facc15" />
              </>
            )}
          </g>
        )}

        {/* Slash Streak VFX when attacking */}
        {state === 'attacking' && (
          <path
            d="M24 10 C29 14, 28 22, 22 26"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-ping opacity-90"
          />
        )}
      </svg>
    </div>
  );
};
