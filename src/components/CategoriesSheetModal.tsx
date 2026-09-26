import React from 'react';
import {
  X,
  Flame,
  Sparkles,
  Heart,
  UtensilsCrossed,
  CupSoda,
  Beer,
  Layers,
  Star,
  Check,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface CategoryOption {
  id: string;
  label: string;
  count: number;
}

interface CategoriesSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  activeCategory: string;
  specialFilter: 'destaques' | 'favoritos' | null;
  onSelectCategory: (categoryId: string) => void;
  onSelectSpecialFilter: (filter: 'destaques' | 'favoritos') => void;
  favoritesCount: number;
  highlightsCount: number;
}

export const CategoriesSheetModal: React.FC<CategoriesSheetModalProps> = ({
  isOpen,
  onClose,
  categories,
  activeCategory,
  specialFilter,
  onSelectCategory,
  onSelectSpecialFilter,
  favoritesCount,
  highlightsCount,
}) => {
  if (!isOpen) return null;

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'pizzas':
        return <Flame className="w-4 h-4 text-[#E4171E]" />;
      case 'pizzas-especiais':
        return <Sparkles className="w-4 h-4 text-amber-500" />;
      case 'pizzas-doces':
        return <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />;
      case 'esfihas':
        return <UtensilsCrossed className="w-4 h-4 text-orange-500" />;
      case 'esfihas-doces':
        return <Sparkles className="w-4 h-4 text-pink-400" />;
      case 'bebidas':
        return <CupSoda className="w-4 h-4 text-blue-500" />;
      case 'cervejas':
        return <Beer className="w-4 h-4 text-amber-600" />;
      default:
        return <BookOpen className="w-4 h-4 text-[#E4171E]" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FBF9F6] border border-[#E8E0D5] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85dvh] sm:max-h-[80vh] overflow-hidden text-[#1C1C1C] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8E0D5] bg-white flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E4171E] block">
              Navegação Rápida
            </span>
            <h3 className="font-heading text-lg sm:text-xl font-bold text-[#1C1C1C]">
              Categorias do Cardápio
            </h3>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Toque para ir direto à seção desejada
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1C1C1C] hover:bg-[#F5EFE6] transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Fechar menu de categorias"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories List */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2 flex-1">
          {/* Quick Filters */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                onSelectSpecialFilter('destaques');
                onClose();
              }}
              className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                specialFilter === 'destaques'
                  ? 'bg-[#E4171E] text-white border-[#E4171E] shadow-sm font-bold'
                  : 'bg-white border-[#E8E0D5] text-[#1C1C1C] hover:border-[#E4171E]/50'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  specialFilter === 'destaques' ? 'bg-white/20 text-white' : 'bg-[#FFF8ED] text-amber-500'
                }`}
              >
                <Star className="w-4 h-4 fill-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold block truncate">Destaques</span>
                <span className={`text-[10px] ${specialFilter === 'destaques' ? 'text-white/80' : 'text-[#6B6B6B]'}`}>
                  {highlightsCount} mais pedidos
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectSpecialFilter('favoritos');
                onClose();
              }}
              className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                specialFilter === 'favoritos'
                  ? 'bg-[#E4171E] text-white border-[#E4171E] shadow-sm font-bold'
                  : 'bg-white border-[#E8E0D5] text-[#1C1C1C] hover:border-[#E4171E]/50'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  specialFilter === 'favoritos' ? 'bg-white/20 text-white' : 'bg-[#FBE4E1] text-[#E4171E]'
                }`}
              >
                <Heart className="w-4 h-4 fill-[#E4171E]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold block truncate">Favoritos</span>
                <span className={`text-[10px] ${specialFilter === 'favoritos' ? 'text-white/80' : 'text-[#6B6B6B]'}`}>
                  {favoritesCount} {favoritesCount === 1 ? 'salvo' : 'salvos'}
                </span>
              </div>
            </button>
          </div>

          <div className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider px-1 pt-1 pb-1">
            Todas as Seções
          </div>

          {/* All Menu Option */}
          <button
            type="button"
            onClick={() => {
              onSelectCategory('todas');
              onClose();
            }}
            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              !specialFilter && activeCategory === 'todas'
                ? 'bg-[#E4171E] text-white border-[#E4171E] shadow-sm'
                : 'bg-white border-[#E8E0D5] text-[#1C1C1C] hover:bg-[#F5EFE6]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  !specialFilter && activeCategory === 'todas'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#F5EFE6] text-[#E4171E]'
                }`}
              >
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold block">
                  Todo o Cardápio
                </span>
                <span
                  className={`text-[11px] ${
                    !specialFilter && activeCategory === 'todas'
                      ? 'text-white/80'
                      : 'text-[#6B6B6B]'
                  }`}
                >
                  Ver todas as opções do início
                </span>
              </div>
            </div>
            {!specialFilter && activeCategory === 'todas' ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#6B6B6B]" />
            )}
          </button>

          {/* Individual Category Sections */}
          {categories.map((cat) => {
            const isActive = !specialFilter && activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onSelectCategory(cat.id);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E4171E] text-white border-[#E4171E] shadow-sm'
                    : 'bg-white border-[#E8E0D5] text-[#1C1C1C] hover:bg-[#F5EFE6]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#F5EFE6]'
                    }`}
                  >
                    {getCategoryIcon(cat.id)}
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold block">
                      {cat.label}
                    </span>
                    <span
                      className={`text-[11px] ${
                        isActive ? 'text-white/80' : 'text-[#6B6B6B]'
                      }`}
                    >
                      {cat.count} {cat.count === 1 ? 'item' : 'itens disponíveis'}
                    </span>
                  </div>
                </div>

                {isActive ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#6B6B6B]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#F5EFE6] border-t border-[#E8E0D5] text-center text-[11px] text-[#6B6B6B]">
          Toque em uma categoria para deslizar a página direto até ela
        </div>
      </div>
    </div>
  );
};
