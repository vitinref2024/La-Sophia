import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface LazyCategorySectionProps {
  id: string;
  label: string;
  products: Product[];
  viewMode: 'compact' | 'grid';
  comparedProducts: Product[];
  favoriteIds: string[];
  specialFilter: string | null;
  searchTerm: string;
  initialRender?: boolean;
  onToggleCompare: (product: Product) => void;
  onToggleFavorite: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export const LazyCategorySection: React.FC<LazyCategorySectionProps> = React.memo(({
  id,
  label,
  products,
  viewMode,
  comparedProducts,
  favoriteIds,
  specialFilter,
  searchTerm,
  initialRender = false,
  onToggleCompare,
  onToggleFavorite,
  onSelectProduct,
}) => {
  const [isVisible, setIsVisible] = useState(initialRender);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isVisible) return;

    // Reveal immediately if search or filter is active
    if (searchTerm.trim() || specialFilter) {
      setIsVisible(true);
      return;
    }

    // Lazy load when category approaches viewport
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { rootMargin: '350px 0px', threshold: 0 }
      );

      if (sectionRef.current) {
        observer.observe(sectionRef.current);
      }

      return () => observer.disconnect();
    } else {
      setIsVisible(true);
    }
  }, [isVisible, searchTerm, specialFilter]);

  return (
    <section
      ref={sectionRef}
      id={id}
      className="scroll-mt-[116px] sm:scroll-mt-[128px]"
    >
      {/* Section Title Header: always present for navigation & scrollspy */}
      <div className="flex items-center justify-between gap-3 mb-3.5 sm:mb-4 pb-2.5 border-b-2 border-[#E4171E]/20">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className="w-1.5 h-5 sm:h-6 rounded-full bg-[#E4171E] shrink-0" />
          <h3 className="font-heading text-lg sm:text-2xl font-bold text-[#1C1C1C] uppercase tracking-wide">
            {label}
          </h3>
          <span className="text-[11px] font-bold text-[#6B6B6B] bg-white px-2.5 py-0.5 rounded-full border border-[#E8E0D5]">
            {products.length} {products.length === 1 ? 'item' : 'itens'}
          </span>
        </div>
      </div>

      {/* Grid of Product Cards: rendered when visible or initially rendered */}
      {isVisible ? (
        <div
          className={
            viewMode === 'compact'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
          }
        >
          {products.map((product, idx) => {
            const isCompared = comparedProducts.some((p) => p.id === product.id);
            return (
              <ProductCard
                key={`${product.id}_${specialFilter || 'todas'}_${searchTerm.trim()}`}
                style={{ animationDelay: `${Math.min(idx * 30, 240)}ms` }}
                product={product}
                viewMode={viewMode}
                isCompared={isCompared}
                priority={initialRender && idx < 2}
                onToggleCompare={onToggleCompare}
                isFavorite={favoriteIds.includes(product.id)}
                onToggleFavorite={onToggleFavorite}
                onSelect={onSelectProduct}
              />
            );
          })}
        </div>
      ) : (
        <div className="w-full min-h-[140px] rounded-xl border border-dashed border-[#E8E0D5]/80 bg-[#FBF9F6]/40 flex items-center justify-center text-xs text-[#8C827A]">
          <span>Carregando {label}...</span>
        </div>
      )}
    </section>
  );
});
