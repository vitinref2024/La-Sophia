import React from 'react';

interface LaSophiaLogoBadgeProps {
  logoUrl?: string;
  pizzeriaName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LaSophiaLogoBadge: React.FC<LaSophiaLogoBadgeProps> = ({
  logoUrl,
  pizzeriaName = 'La Sophia Pizzaria e Esfiharia',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8',
    md: 'w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10',
    lg: 'w-14 h-14 sm:w-16 sm:h-16',
  }[size];

  return (
    <div className="relative group shrink-0">
      <div
        className={`${sizeClasses} rounded-full overflow-hidden border border-[#D4AF37]/50 bg-black flex items-center justify-center shrink-0 shadow-md ring-1 ring-white/15 transition-transform group-hover:scale-105 select-none`}
        title={pizzeriaName}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={pizzeriaName}
            className="w-full h-full object-cover object-center pointer-events-none select-none"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            width="64"
            height="64"
            referrerPolicy="no-referrer"
          />
        ) : (
          /* High-Fidelity Emblem of La Sophia Pizzaria e Esfiharia */
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background */}
            <circle cx="100" cy="100" r="98" fill="#0A0A0A" />
            <circle cx="100" cy="100" r="94" fill="#141414" stroke="#D4AF37" strokeWidth="2.5" />
            <circle cx="100" cy="100" r="90" fill="none" stroke="#D4AF37" strokeWidth="0.8" strokeDasharray="3 2" />

            {/* Pizza illustration at the top */}
            <g transform="translate(100, 52) scale(0.65)">
              <circle cx="0" cy="0" r="42" fill="#D9822B" stroke="#9C5212" strokeWidth="2" />
              <circle cx="0" cy="0" r="36" fill="#F4C462" />
              {/* Pepperoni / toppings */}
              <circle cx="-16" cy="-12" r="8" fill="#C02626" stroke="#8E1414" strokeWidth="1.5" />
              <circle cx="14" cy="-14" r="8" fill="#C02626" stroke="#8E1414" strokeWidth="1.5" />
              <circle cx="0" cy="6" r="8.5" fill="#C02626" stroke="#8E1414" strokeWidth="1.5" />
              <circle cx="-18" cy="16" r="7.5" fill="#C02626" stroke="#8E1414" strokeWidth="1.5" />
              <circle cx="18" cy="14" r="7" fill="#C02626" stroke="#8E1414" strokeWidth="1.5" />
              {/* Basil leaves */}
              <path d="M-6 -22 C-14 -22, -14 -12, -4 -16 Z" fill="#22C55E" />
              <path d="M10 -4 C16 -12, 22 -6, 12 2 Z" fill="#22C55E" />
              <path d="M-10 2 C-18 6, -12 14, -6 6 Z" fill="#22C55E" />
            </g>

            {/* "La Sophia" Text in ornate script */}
            <text
              x="100"
              y="114"
              textAnchor="middle"
              fill="#E11D48"
              stroke="#FFF"
              strokeWidth="2.5"
              paintOrder="stroke fill"
              fontSize="34"
              fontWeight="900"
              fontFamily="Georgia, serif"
              fontStyle="italic"
              letterSpacing="-0.5"
            >
              La Sophia
            </text>

            {/* Ribbon Banner at the bottom */}
            <path
              d="M25 142 Q100 156 175 142 L168 162 Q100 174 32 162 Z"
              fill="#14532D"
              stroke="#D4AF37"
              strokeWidth="1.5"
            />
            <text
              x="100"
              y="156"
              textAnchor="middle"
              fill="#FDE047"
              fontSize="11.5"
              fontWeight="900"
              fontFamily="sans-serif"
              letterSpacing="1.2"
            >
              PIZZARIA E ESFIHARIA
            </text>

            {/* Italian Flag Shield */}
            <g transform="translate(100, 178) scale(0.6)">
              <rect x="-18" y="-8" width="12" height="16" fill="#15803D" />
              <rect x="-6" y="-8" width="12" height="16" fill="#FFFFFF" />
              <rect x="6" y="-8" width="12" height="16" fill="#B91C1C" />
              <rect x="-18" y="-8" width="36" height="16" fill="none" stroke="#D4AF37" strokeWidth="1.5" />
            </g>
          </svg>
        )}

      </div>
    </div>
  );
};
