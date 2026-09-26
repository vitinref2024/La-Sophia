import React from 'react';
import { X, Heart, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteProducts: Product[];
  onToggleFavorite: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  favoriteProducts,
  onToggleFavorite,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-3xl max-w-[100vw] max-h-[96dvh] bg-[#FBF9F6] border border-[#E8E0D5] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#1C1C1C] my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 pr-10 sm:pr-12 bg-white border-b border-[#E8E0D5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#FBE4E1] text-[#E4171E] shrink-0">
              <Heart className="w-5 h-5 fill-[#E4171E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg sm:text-xl font-bold text-[#1C1C1C]">
                  Meus Favoritos
                </h2>
                <span className="text-[11px] font-semibold bg-[#F5EFE6] text-[#6B6B6B] px-2 py-0.5 rounded-full border border-[#E8E0D5]">
                  {favoriteProducts.length} {favoriteProducts.length === 1 ? 'item' : 'itens'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#6B6B6B] mt-0.5">
                Seus sabores e produtos preferidos salvos neste aparelho para acesso rápido.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-lg text-[#6B6B6B] hover:text-[#1C1C1C] hover:bg-[#F5EFE6] transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {favoriteProducts.length === 0 ? (
            <div className="py-14 px-4 text-center max-w-md mx-auto">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FBE4E1] text-[#E4171E] flex items-center justify-center mb-3">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#1C1C1C] mb-1">
                Nenhum favorito salvo ainda
              </h3>
              <p className="text-xs text-[#6B6B6B] leading-relaxed mb-5">
                Toque no ícone de coração nos cards de pizzas, esfihas ou bebidas para salvar seus produtos favoritos e encontrá-los rapidamente aqui.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#E4171E] hover:bg-[#B80F16] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Explorar Cardápio
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {favoriteProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode="compact"
                  isFavorite={true}
                  onToggleFavorite={onToggleFavorite}
                  onSelect={(p) => {
                    onClose();
                    onSelectProduct(p);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#E8E0D5] flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#F5EFE6] hover:bg-[#E8E0D5] text-[#1C1C1C] text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
