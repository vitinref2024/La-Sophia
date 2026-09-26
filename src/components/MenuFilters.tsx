import React from 'react';
import { Heart, Star, Pizza, UtensilsCrossed, Wine, Candy, RotateCcw } from 'lucide-react';

export type QuickFilterType =
  | 'todos'
  | 'pizzas'
  | 'esfihas'
  | 'bebidas'
  | 'doces'
  | 'destaques'
  | 'favoritos';

interface MenuFiltersProps {
  activeFilter: QuickFilterType;
  onSelectFilter: (filter: QuickFilterType) => void;
  favoritesCount: number;
  isFiltered: boolean;
  onResetAll: () => void;
}

export const MenuFilters: React.FC<MenuFiltersProps> = ({
  activeFilter,
  onSelectFilter,
  favoritesCount,
  isFiltered,
  onResetAll,
}) => {
  const filters: { id: QuickFilterType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'todos', label: 'Todos os tipos', icon: null },
    { id: 'pizzas', label: 'Pizzas', icon: <Pizza className="w-3.5 h-3.5" /> },
    { id: 'esfihas', label: 'Esfihas', icon: <UtensilsCrossed className="w-3.5 h-3.5" /> },
    { id: 'bebidas', label: 'Bebidas', icon: <Wine className="w-3.5 h-3.5" /> },
    { id: 'doces', label: 'Doces', icon: <Candy className="w-3.5 h-3.5" /> },
    { id: 'destaques', label: 'Destaques', icon: <Star className="w-3.5 h-3.5" /> },
    {
      id: 'favoritos',
      label: 'Favoritos',
      icon: <Heart className={`w-3.5 h-3.5 ${favoritesCount > 0 ? 'fill-[#E4171E] text-[#E4171E]' : ''}`} />,
      badge: favoritesCount,
    },
  ];

  return (
    <div className="w-full flex items-center justify-between gap-2 mb-4">
      {/* Scrollable pills bar */}
      <div className="flex-1 overflow-x-auto scrollbar-none py-1 -mx-2 px-2 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-1.5 min-w-max">
          {filters.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectFilter(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-[#1C1C1C] text-white border-[#1C1C1C] shadow-xs'
                    : 'bg-[#FBF9F6] text-[#6B6B6B] hover:text-[#1C1C1C] hover:bg-white border-[#E8E0D5]'
                }`}
              >
                {f.icon}
                <span>{f.label}</span>
                {typeof f.badge === 'number' && f.badge > 0 && (
                  <span
                    className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-[#E4171E] text-white' : 'bg-[#FBE4E1] text-[#E4171E]'
                    }`}
                  >
                    {f.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset button if custom filter is active */}
      {isFiltered && (
        <button
          type="button"
          onClick={onResetAll}
          className="text-xs text-[#6B6B6B] hover:text-[#E4171E] flex items-center gap-1 shrink-0 px-2 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-[#E8E0D5] transition-colors cursor-pointer"
          title="Limpar todos os filtros e busca"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">Limpar</span>
        </button>
      )}
    </div>
  );
};
