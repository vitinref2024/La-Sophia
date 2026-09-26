import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { PizzeriaInfo } from '../types';
import { formatBRL } from '../data/menuData';
import { getPizzeriaStatus } from '../utils/businessHours';
import { LaSophiaLogoBadge } from './LaSophiaLogoBadge';

interface HeaderProps {
  pizzeria: PizzeriaInfo;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onNavigateCategory?: (categoryId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  pizzeria,
  cartCount,
  cartTotal,
  onOpenCart,
}) => {
  const status = getPizzeriaStatus();
  const [isBumping, setIsBumping] = useState(false);

  // Microinteraction: bounce/scale cart badge when an item is added
  useEffect(() => {
    if (cartCount > 0) {
      setIsBumping(true);
      const timer = window.setTimeout(() => setIsBumping(false), 300);
      return () => window.clearTimeout(timer);
    }
  }, [cartCount]);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#111111]/95 border-b border-[#222222] shadow-md backdrop-blur-md">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 min-h-[56px] sm:min-h-[64px] py-2 flex items-center justify-between gap-3">
        {/* Left: Logo Oficial da Pizzaria La Sophia / Wordmark */}
        <div className="flex items-center gap-2.5 min-w-0">
          <LaSophiaLogoBadge
            logoUrl={pizzeria.logoImage}
            pizzeriaName={pizzeria.name}
            size="md"
          />
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
              if (window.location.pathname !== '/' || window.location.hash) {
                window.history.pushState(null, '', '/');
              }
            }}
            className="group flex items-center min-w-0"
            aria-label={pizzeria.name}
          >
            <span className="font-heading text-[clamp(1.05rem,3.8vw,1.4rem)] sm:text-xl md:text-2xl font-black tracking-tight text-white group-hover:text-[#E31B23] transition-colors leading-tight [overflow-wrap:anywhere]">
              {pizzeria.name}
            </span>
          </a>
        </div>

        {/* Right: Status badge + Cart button */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Discreet status badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
              status.isOpen
                ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80'
                : 'bg-neutral-900/90 text-neutral-400 border-neutral-800'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
              }`}
            />
            <span className="leading-none">{status.isOpen ? 'Aberta' : 'Fechada'}</span>
          </span>

          {/* Cart Button: 48px touch target, red highlight, item counter & microinteraction */}
          <button
            type="button"
            onClick={onOpenCart}
            className={`relative min-h-[48px] px-3.5 sm:px-4 py-2 rounded-xl bg-[#E31B23] hover:bg-[#B80F16] active:scale-95 text-white font-medium text-xs sm:text-sm transition-all duration-200 shadow-md cursor-pointer flex items-center gap-2 ${
              isBumping ? 'scale-105 shadow-red-950/60' : 'scale-100'
            }`}
            aria-label="Ver Carrinho de Compras"
          >
            <div className="relative flex items-center justify-center">
              <ShoppingBag
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${
                  isBumping ? '-rotate-12' : 'rotate-0'
                }`}
              />
              {cartCount > 0 && (
                <span
                  className={`absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-white text-[#E31B23] text-[10px] font-black flex items-center justify-center shadow-xs transition-transform duration-200 ${
                    isBumping ? 'scale-125' : 'scale-100'
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline font-bold tabular-nums">
              {cartCount === 0 ? 'Carrinho' : formatBRL(cartTotal)}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
