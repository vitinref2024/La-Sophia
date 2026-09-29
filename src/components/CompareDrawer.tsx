import React from 'react';
import { X, Scale, Plus, Check } from 'lucide-react';
import { Product } from '../types';
import { formatBRL } from '../data/menuData';
import { safeImageUrl } from '../utils/imageUrl';

interface CompareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  comparedProducts: Product[];
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
  onSelectProduct: (product: Product) => void;
  onAssembleHalfHalf?: (p1: Product, p2: Product) => void;
}

export const CompareDrawer: React.FC<CompareDrawerProps> = ({
  isOpen,
  onClose,
  comparedProducts,
  onRemoveProduct,
  onClearAll,
  onSelectProduct,
  onAssembleHalfHalf,
}) => {
  if (!isOpen || comparedProducts.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4 bg-[#FBF9F6] border-t border-[#E8E0D5] shadow-2xl animate-slideUp text-[#1C1C1C] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#FBE4E1] text-[#E4171E] shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="font-heading text-sm font-bold text-[#1C1C1C]">
              Comparando {comparedProducts.length} sabor(es)
            </h3>
            <span className="text-[11px] text-[#6B6B6B] hidden sm:inline">
              Compare ingredientes e valores lado a lado
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {comparedProducts.length === 2 && onAssembleHalfHalf && (
              <button
                type="button"
                onClick={() => onAssembleHalfHalf(comparedProducts[0], comparedProducts[1])}
                className="min-h-[40px] px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#E4171E] hover:bg-[#B80F16] active:bg-[#B80F16] text-white text-[11px] sm:text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Montar Meio a Meio</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-[#6B6B6B] hover:text-[#1C1C1C] underline cursor-pointer px-1 min-h-[36px] flex items-center"
            >
              Limpar
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#1C1C1C] hover:bg-[#E8E0D5]/50 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Fechar comparador"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Side-by-side Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[50vh] sm:max-h-60 overflow-y-auto">
          {comparedProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white border border-[#E8E0D5] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {prod.image && (
                      <img
                        src={safeImageUrl(prod.image)}
                        alt={prod.name.replace(/^\d+\s*-\s*/, '').trim()}
                        className="w-10 h-10 rounded-lg object-cover object-center border border-[#E8E0D5] shrink-0 bg-[#F0EAE1]"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <h4 className="font-semibold text-xs sm:text-sm text-[#1C1C1C] [overflow-wrap:anywhere]">
                      {prod.name}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveProduct(prod.id)}
                    className="text-[#6B6B6B] hover:text-[#E4171E] p-1 cursor-pointer shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center"
                    title="Remover da comparação"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] sm:text-xs text-[#6B6B6B] mb-2 leading-relaxed [overflow-wrap:anywhere]">
                  {prod.description}
                </p>

                {/* Sizes prices comparison */}
                {prod.pricesBySize && (
                  <div className="space-y-1 py-1.5 border-t border-b border-[#E8E0D5]/80 my-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#6B6B6B]">Pizza (8 fatias):</span>
                      <span className="font-bold text-[#E4171E] tabular-nums">
                        {formatBRL(prod.pricesBySize.pizza)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B6B6B]">Broto (4 fatias):</span>
                      <span className="font-semibold text-[#1C1C1C] tabular-nums">
                        {formatBRL(prod.pricesBySize.broto)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onSelectProduct(prod)}
                className="mt-2 w-full min-h-[44px] py-2 rounded-lg bg-[#E4171E] hover:bg-[#B80F16] active:bg-[#B80F16] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Escolher este sabor</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
