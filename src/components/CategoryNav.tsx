import React, { useRef, useEffect } from 'react';
import { Star, Heart, Layers, Flame, Sparkles, UtensilsCrossed, CupSoda, Beer, LayoutGrid } from 'lucide-react';

export type PrimaryFilter = 'destaques' | 'favoritos' | null;

export interface CategoryItem {
  id: string;
  label: string;
}

export const MENU_CATEGORIES: CategoryItem[] = [
  { id: 'todas', label: 'Todo o Cardápio' },
  { id: 'pizzas', label: 'Pizzas Salgadas' },
  { id: 'pizzas-especiais', label: 'Pizzas Especiais' },
  { id: 'pizzas-doces', label: 'Pizzas Doces' },
  { id: 'esfihas', label: 'Esfihas Salgadas' },
  { id: 'esfihas-doces', label: 'Esfihas Doces' },
  { id: 'bebidas', label: 'Bebidas' },
  { id: 'cervejas', label: 'Cervejas' },
];

interface CategoryNavProps {
  primaryFilter: PrimaryFilter;
  onSelectPrimaryFilter: (filter: 'destaques' | 'favoritos') => void;
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
  favoritesCount: number;
  onOpenCategoriesSheet: () => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
  primaryFilter,
  onSelectPrimaryFilter,
  activeCategory,
  onSelectCategory,
  favoritesCount,
  onOpenCategoriesSheet,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Auto-scroll active category into view inside the horizontal bar
  useEffect(() => {
    const key = primaryFilter ? primaryFilter : activeCategory;
    const activeBtn = buttonRefs.current[key];
    if (activeBtn && containerRef.current) {
      window.requestAnimationFrame(() => {
        if (!activeBtn || !containerRef.current) return;
        const container = containerRef.current;
        const btnLeft = activeBtn.offsetLeft;
        const btnWidth = activeBtn.offsetWidth;
        const containerWidth = container.offsetWidth;

        const scrollTarget = btnLeft - containerWidth / 2 + btnWidth / 2;
        container.scrollTo({
          left: Math.max(0, scrollTarget),
          behavior: 'smooth',
        });
      });
    }
  }, [activeCategory, primaryFilter]);

  const getPillIcon = (id: string) => {
    switch (id) {
      case 'pizzas':
        return <Flame className="w-3.5 h-3.5 text-current shrink-0" />;
      case 'pizzas-especiais':
        return <Sparkles className="w-3.5 h-3.5 text-current shrink-0" />;
      case 'pizzas-doces':
        return <Heart className="w-3.5 h-3.5 text-current shrink-0" />;
      case 'esfihas':
      case 'esfihas-doces':
        return <UtensilsCrossed className="w-3.5 h-3.5 text-current shrink-0" />;
      case 'bebidas':
        return <CupSoda className="w-3.5 h-3.5 text-current shrink-0" />;
      case 'cervejas':
        return <Beer className="w-3.5 h-3.5 text-current shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <nav
      aria-label="Navegação de Categorias do Cardápio"
      className="sticky top-[56px] sm:top-[64px] z-30 w-full bg-[#F5EFE6]/98 backdrop-blur-md border-b border-[#E8E0D5] shadow-xs transition-all"
    >
      <div className="w-full max-w-[1200px] mx-auto px-2 sm:px-4 py-2 flex items-center gap-2">
        {/* Quick Menu Button: opens CategoriesSheetModal */}
        <button
          type="button"
          onClick={onOpenCategoriesSheet}
          className="min-h-[44px] px-3.5 py-2 rounded-full bg-[#1C1C1C] hover:bg-[#E4171E] active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
          title="Ver todas as categorias em lista rápida"
          aria-label="Menu de Categorias"
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="text-[11px] uppercase tracking-wider">Categorias</span>
        </button>

        <div className="h-6 w-px bg-[#E8E0D5] shrink-0" />

        {/* Scrollable category pills in a single compact row */}
        <div
          ref={containerRef}
          className="flex-1 overflow-x-auto scrollbar-none overscroll-x-contain [scroll-snap-type:x_mandatory] scroll-smooth flex items-center gap-2 py-0.5 pr-4"
        >
          {/* 1. Destaques */}
          <button
            ref={(el) => {
              buttonRefs.current['destaques'] = el;
            }}
            type="button"
            onClick={() => onSelectPrimaryFilter('destaques')}
            className={`min-h-[44px] px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer border shrink-0 [scroll-snap-align:center] flex items-center gap-1.5 ${
              primaryFilter === 'destaques'
                ? 'bg-[#E4171E] text-white border-[#E4171E] shadow-sm font-bold'
                : 'bg-white text-[#1C1C1C] hover:border-[#E4171E]/40 border-[#E8E0D5]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${primaryFilter === 'destaques' ? 'fill-white text-white' : 'fill-amber-400 text-amber-500'}`} />
            <span>Destaques</span>
          </button>

          {/* 2. Favoritos */}
          <button
            ref={(el) => {
              buttonRefs.current['favoritos'] = el;
            }}
            type="button"
            onClick={() => onSelectPrimaryFilter('favoritos')}
            className={`min-h-[44px] px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer border shrink-0 [scroll-snap-align:center] flex items-center gap-1.5 ${
              primaryFilter === 'favoritos'
                ? 'bg-[#E4171E] text-white border-[#E4171E] shadow-sm font-bold'
                : 'bg-white text-[#1C1C1C] hover:border-[#E4171E]/40 border-[#E8E0D5]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${primaryFilter === 'favoritos' ? 'fill-white text-white' : 'fill-[#E4171E] text-[#E4171E]'}`} />
            <span>Favoritos</span>
            {favoritesCount > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-tight ${
                  primaryFilter === 'favoritos'
                    ? 'bg-white text-[#E4171E]'
                    : 'bg-[#FBE4E1] text-[#E4171E]'
                }`}
              >
                {favoritesCount}
              </span>
            )}
          </button>

          {/* 3. Todas as categorias */}
          {MENU_CATEGORIES.map((cat) => {
            const isActive = !primaryFilter && activeCategory === cat.id;
            const icon = getPillIcon(cat.id);

            return (
              <button
                key={cat.id}
                ref={(el) => {
                  buttonRefs.current[cat.id] = el;
                }}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`min-h-[44px] px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer border shrink-0 [scroll-snap-align:center] flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#E4171E] text-white border-[#E4171E] shadow-sm font-bold'
                    : 'bg-white text-[#1C1C1C] hover:border-[#E4171E]/40 border-[#E8E0D5]'
                }`}
              >
                {icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
