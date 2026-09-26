import React, { useState, useEffect } from 'react';
import { LayoutGrid, ArrowUp } from 'lucide-react';

interface FloatingCategoriesButtonProps {
  onOpenCategories: () => void;
  onScrollToTop?: () => void;
  hasCartItems: boolean;
}

export const FloatingCategoriesButton: React.FC<FloatingCategoriesButtonProps> = ({
  onOpenCategories,
  onScrollToTop,
  hasCartItems,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling past hero (~350px)
      if (window.scrollY > 350) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed z-30 transition-all duration-300 pointer-events-auto left-1/2 -translate-x-1/2 flex items-center gap-2 ${
        hasCartItems
          ? 'bottom-[76px] sm:bottom-6'
          : 'bottom-4 sm:bottom-6'
      }`}
    >
      <button
        type="button"
        onClick={onOpenCategories}
        className="min-h-[44px] px-4 py-2.5 rounded-full bg-[#1C1C1C]/95 hover:bg-[#E4171E] active:bg-[#B80F16] text-white border border-white/20 shadow-2xl backdrop-blur-md text-xs font-bold tracking-wider flex items-center gap-2 cursor-pointer transition-all active:scale-95 group"
        title="Abrir menu de categorias"
        aria-label="Abrir menu de categorias"
      >
        <LayoutGrid className="w-4 h-4 text-[#E4171E] group-hover:text-white transition-colors" />
        <span className="uppercase text-[11px] font-bold">Categorias</span>
      </button>

      {onScrollToTop && (
        <button
          type="button"
          onClick={onScrollToTop}
          className="min-h-[44px] min-w-[44px] p-2.5 rounded-full bg-[#1C1C1C]/90 hover:bg-[#E4171E] text-white border border-white/20 shadow-2xl backdrop-blur-md flex items-center justify-center cursor-pointer transition-all active:scale-95"
          title="Voltar ao topo"
          aria-label="Voltar ao topo do cardápio"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
