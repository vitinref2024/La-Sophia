import React from 'react';
import {
  Flame,
  Clock,
  Bike,
  ArrowDown,
  MessageCircle,
  Pizza,
  Layers,
  Wine,
  Sparkles,
} from 'lucide-react';
import { PizzeriaInfo } from '../types';
import { getPizzeriaStatus } from '../utils/businessHours';

interface HeroProps {
  pizzeria: PizzeriaInfo;
  onNavigateCategory: (categoryId: string) => void;
  onAssembleHalfHalf?: () => void;
  onOpenWhatsApp?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  pizzeria,
  onNavigateCategory,
  onAssembleHalfHalf,
  onOpenWhatsApp,
}) => {
  const status = getPizzeriaStatus();

  const scrollToMenu = () => {
    const el = document.getElementById('cardapio');
    if (el) {
      const headerOffset = window.innerWidth >= 768 ? 80 : 68;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth',
      });
    }
  };

  const handleWhatsAppClick = () => {
    if (onOpenWhatsApp) {
      onOpenWhatsApp();
    } else {
      const msg = encodeURIComponent(
        `Olá! Gostaria de fazer um pedido na ${pizzeria.name}.`
      );
      window.open(`https://wa.me/${pizzeria.whatsappNumber}?text=${msg}`, '_blank');
    }
  };

  // Category shortcuts
  const categoryShortcuts = [
    {
      id: 'pizzas',
      label: 'Pizzas',
      icon: Pizza,
      action: () => onNavigateCategory('pizzas'),
    },
    {
      id: 'esfihas',
      label: 'Esfihas',
      icon: Layers,
      action: () => onNavigateCategory('esfihas'),
    },
    {
      id: 'meia-a-meia',
      label: 'Meia-a-Meia',
      icon: Sparkles,
      action: () => {
        if (onAssembleHalfHalf) {
          onAssembleHalfHalf();
        } else {
          onNavigateCategory('pizzas');
        }
      },
    },
    {
      id: 'bebidas',
      label: 'Bebidas',
      icon: Wine,
      action: () => onNavigateCategory('bebidas'),
    },
    {
      id: 'combos',
      label: 'Combos',
      icon: Flame,
      action: () => {
        const promoEl = document.getElementById('promo-especial');
        if (promoEl) {
          const headerOffset = window.innerWidth >= 768 ? 90 : 76;
          const elementPosition = promoEl.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth',
          });
        } else {
          scrollToMenu();
        }
      },
    },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-[#111111] text-white">
      {/* Background Image: Authentic pizza in wood-fired oven with embers */}
      <img
        src={pizzeria.heroImage || 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1920&q=85'}
        alt="Pizza artesanal no forno a lenha"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none brightness-105 contrast-105"
        loading="eager"
        referrerPolicy="no-referrer"
      />

      {/* Light gradient overlay that keeps the pizza image clearly visible while preserving text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/40 to-[#111111]/90 pointer-events-none" />

      {/* Central Container: max-width 1200px, 16px/24px/32px padding */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-14 text-center flex flex-col items-center">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
          {/* 1. Status da loja em uma linha */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/70 border border-white/20 backdrop-blur-md text-xs font-medium text-neutral-200 mb-4 sm:mb-5 shadow-md">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                status.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
              }`}
            />
            <span className="font-semibold text-white">
              {status.isOpen ? 'Aberta agora' : 'Fechada no momento'}
            </span>
            <span className="text-neutral-500">·</span>
            <span className="text-neutral-300">
              {status.isOpen ? `Pedidos até ${status.closeTime}` : status.details}
            </span>
          </div>

          {/* 2. Título único e forte com tipografia fluida clamp(1.75rem, 5vw, 3rem) */}
          <h1 className="font-heading text-[clamp(1.75rem,5vw,3rem)] font-black tracking-tight text-white leading-tight sm:leading-tight mb-3 text-center [overflow-wrap:anywhere] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] w-full">
            Pizzas no forno a lenha e esfihas artesanais
          </h1>

          {/* 3. Subtítulo curto com tipografia fluida clamp(0.9rem, 2.5vw, 1.1rem) */}
          <p className="text-[clamp(0.9rem,2.5vw,1.1rem)] text-white/95 leading-normal text-center max-w-md mx-auto mb-5 [overflow-wrap:anywhere] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] font-medium">
            Peça direto pelo WhatsApp em poucos segundos.
          </p>

          {/* 4. Linha única de informações rápidas, flex-wrap para telas estreitas */}
          <div className="w-full flex items-center justify-center flex-wrap gap-2.5 sm:gap-4 text-xs text-neutral-100 font-medium mb-6 sm:mb-7">
            <span className="flex items-center gap-1.5 shrink-0 bg-black/60 px-2.5 py-1 rounded-md border border-white/20 backdrop-blur-xs shadow-xs">
              <Flame className="w-3.5 h-3.5 text-[#E31B23] shrink-0" />
              <span>Forno a lenha</span>
            </span>
            <span className="text-neutral-400 hidden sm:inline">·</span>
            <span className="flex items-center gap-1.5 shrink-0 bg-black/60 px-2.5 py-1 rounded-md border border-white/20 backdrop-blur-xs shadow-xs">
              <Clock className="w-3.5 h-3.5 text-[#E31B23] shrink-0" />
              <span>Entrega em ~40 min</span>
            </span>
            <span className="text-neutral-400 hidden sm:inline">·</span>
            <span
              className="flex items-center gap-1.5 shrink-0 bg-black/60 px-2.5 py-1 rounded-md border border-white/20 backdrop-blur-xs shadow-xs"
              title="A taxa é calculada automaticamente conforme a distância entre a pizzaria e o endereço de entrega."
            >
              <Bike className="w-3.5 h-3.5 text-[#E31B23] shrink-0" />
              <span>Taxa calculada por distância</span>
            </span>
          </div>

          {/* 5. AÇÕES PRINCIPAIS: 100% no celular, max-width 420px e centralizado no desktop, min-h 48px */}
          <div className="w-full max-w-[420px] mx-auto flex flex-col gap-3 mb-6 sm:mb-8">
            {/* Botão primário */}
            <button
              type="button"
              onClick={scrollToMenu}
              className="w-full min-h-[48px] sm:min-h-[52px] px-6 py-3.5 rounded-xl bg-[#E31B23] hover:bg-[#B80F16] active:scale-[0.98] text-white font-heading font-black text-base sm:text-lg tracking-wider transition-all duration-150 shadow-lg shadow-red-950/60 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>PEDIR AGORA</span>
              <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Botão secundário */}
            <button
              type="button"
              onClick={handleWhatsAppClick}
              className="w-full min-h-[48px] sm:min-h-[50px] px-6 py-3.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-900 active:scale-[0.98] border border-neutral-700/80 hover:border-neutral-500 text-white font-semibold text-xs sm:text-sm tracking-wide transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer backdrop-blur-xs"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Pedir pelo WhatsApp</span>
            </button>
          </div>

          {/* 6. ATALHOS DE CATEGORIA: flex-wrap com scroll suave e sem corte */}
          <div className="w-full max-w-[500px] mx-auto flex items-center justify-center flex-wrap gap-2 mb-6 sm:mb-7">
            {categoryShortcuts.map((chip) => {
              const Icon = chip.icon;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={chip.action}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white text-xs font-semibold transition-all duration-150 cursor-pointer backdrop-blur-xs min-h-[38px]"
                >
                  <Icon className="w-3.5 h-3.5 text-[#E31B23] shrink-0" />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>

          {/* 7. DESTAQUE / PROMOÇÃO: Card compacto centralizado sem corte de texto */}
          <div
            id="promo-especial"
            className="w-full max-w-[420px] sm:max-w-md mx-auto bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-left shadow-lg backdrop-blur-xs scroll-mt-24"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=200&q=80"
                alt="Pizza Meia-a-Meia Especial"
                className="w-14 h-14 rounded-xl object-cover shrink-0 border border-neutral-700/80 shadow-xs"
                loading="lazy"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E31B23] block leading-none mb-1">
                  Especial La Sophia
                </span>
                <p className="text-xs sm:text-sm font-semibold text-white leading-snug [overflow-wrap:anywhere]">
                  Monte sua pizza meia-a-meia com 2 sabores e borda recheada
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onAssembleHalfHalf}
              className="px-3.5 py-2.5 rounded-xl bg-[#E31B23] hover:bg-[#B80F16] active:scale-95 text-white text-xs font-bold whitespace-nowrap transition-all shadow-md shrink-0 cursor-pointer min-h-[44px]"
            >
              Montar agora
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
