import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, ArrowRight, Sparkles, Check, Beer, Coffee, Utensils } from 'lucide-react';
import { Product } from '../types';
import { formatBRL } from '../data/menuData';

interface BeveragesUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  allProducts: Product[];
  onConfirmComplements: (items: Array<{ product: Product; quantity: number }>) => void;
  onSkip: () => void;
  pizzaName?: string;
}

export const BeveragesUpsellModal: React.FC<BeveragesUpsellModalProps> = ({
  isOpen,
  onClose,
  allProducts,
  onConfirmComplements,
  onSkip,
  pizzaName,
}) => {
  // Store quantities for complementary items: { [productId]: quantity }
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'bebidas' | 'cervejas' | 'esfihas'>('bebidas');

  // Filter products by complementary categories from real menu data
  const beverages = useMemo(() => {
    return allProducts.filter((p) => p.category === 'bebidas');
  }, [allProducts]);

  const beers = useMemo(() => {
    return allProducts.filter((p) => p.category === 'cervejas');
  }, [allProducts]);

  const sweetsAndEsfihas = useMemo(() => {
    return allProducts.filter((p) => p.category === 'esfihas' || p.category === 'esfihas-doces' || p.category === 'pizzas-doces');
  }, [allProducts]);

  const displayedProducts = useMemo(() => {
    if (activeTab === 'bebidas') return beverages;
    if (activeTab === 'cervejas') return beers;
    return sweetsAndEsfihas;
  }, [activeTab, beverages, beers, sweetsAndEsfihas]);

  if (!isOpen) return null;

  // Handler to increment item
  const handleIncrement = (product: Product) => {
    setSelectedQuantities((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));
  };

  // Handler to decrement item
  const handleDecrement = (productId: string) => {
    setSelectedQuantities((prev) => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: current - 1 };
    });
  };

  // Calculate total extra items and total extra price
  const totalExtraItemsCount = Object.values(selectedQuantities).reduce((acc, qty) => acc + qty, 0);

  const totalExtraPrice = Object.entries(selectedQuantities).reduce((acc, [prodId, qty]) => {
    const prod = allProducts.find((p) => p.id === prodId);
    return acc + (prod ? prod.price * qty : 0);
  }, 0);

  const handleConfirm = () => {
    const itemsToAdd: Array<{ product: Product; quantity: number }> = [];
    Object.entries(selectedQuantities).forEach(([prodId, qty]) => {
      const prod = allProducts.find((p) => p.id === prodId);
      if (prod && qty > 0) {
        itemsToAdd.push({ product: prod, quantity: qty });
      }
    });

    onConfirmComplements(itemsToAdd);
    setSelectedQuantities({});
  };

  const handleSkipClick = () => {
    setSelectedQuantities({});
    onSkip();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      {/* Modal Container: Branco-gelo #FBF9F6, borda #E8E0D5 */}
      <div className="relative w-full max-w-2xl max-w-[100vw] max-h-[96dvh] bg-[#FBF9F6] border border-[#E8E0D5] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#1C1C1C] my-auto">
        {/* Header */}
        <div className="p-3.5 sm:p-5 pr-10 sm:pr-12 bg-white border-b border-[#E8E0D5] relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full text-[#6B6B6B] hover:text-[#1C1C1C] hover:bg-[#F5EFE6] transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#FBE4E1] text-[#E4171E] border border-[#E4171E]/20">
              Etapa 2 · Acompanhamentos
            </span>
            {pizzaName && (
              <span className="text-xs text-[#6B6B6B] [overflow-wrap:anywhere]">
                Pizza adicionada: <strong className="text-[#1C1C1C]">{pizzaName}</strong>
              </span>
            )}
          </div>

          <h2 className="font-heading text-lg sm:text-2xl font-bold text-[#1C1C1C] leading-snug">
            Para acompanhar seu pedido, deseja adicionar uma bebida?
          </h2>
          <p className="text-[11px] sm:text-xs text-[#6B6B6B] mt-1">
            Selecione refrigerantes de 2L gelados, cervejas ou esfihas para completar a sua experiência.
          </p>

          {/* Complement Category Tabs */}
          <div className="flex items-center gap-2 mt-3 sm:mt-4 overflow-x-auto pb-1 scrollbar-none overscroll-x-contain">
            <button
              type="button"
              onClick={() => setActiveTab('bebidas')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
                activeTab === 'bebidas'
                  ? 'bg-[#E4171E] text-white shadow-xs'
                  : 'bg-white text-[#1C1C1C] hover:bg-[#F5EFE6] border border-[#E8E0D5]'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Refrigerantes & Bebidas ({beverages.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cervejas')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
                activeTab === 'cervejas'
                  ? 'bg-[#E4171E] text-white shadow-xs'
                  : 'bg-white text-[#1C1C1C] hover:bg-[#F5EFE6] border border-[#E8E0D5]'
              }`}
            >
              <Beer className="w-3.5 h-3.5" />
              <span>Cervejas Geladas ({beers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('esfihas')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
                activeTab === 'esfihas'
                  ? 'bg-[#E4171E] text-white shadow-xs'
                  : 'bg-white text-[#1C1C1C] hover:bg-[#F5EFE6] border border-[#E8E0D5]'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Outros Complementos</span>
            </button>
          </div>
        </div>

        {/* Scrollable Products List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {displayedProducts.map((prod) => {
              const currentQty = selectedQuantities[prod.id] || 0;
              const isSelected = currentQty > 0;

              return (
                <div
                  key={prod.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 shadow-xs ${
                    isSelected
                      ? 'border-[#E4171E] bg-[#FBE4E1] ring-1 ring-[#E4171E]'
                      : 'border-[#E8E0D5] bg-white hover:border-[#D8CEBF]'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#F0EAE1] shrink-0 border border-[#E8E0D5]">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm text-[#1C1C1C] truncate">
                      {prod.name}
                    </h4>
                    <p className="text-[11px] text-[#6B6B6B] truncate">
                      {prod.description}
                    </p>
                    <div className="font-bold text-sm text-[#E4171E] tabular-nums mt-0.5">
                      {formatBRL(prod.price)}
                    </div>
                  </div>

                  {/* Actions: Add button or Stepper */}
                  <div className="shrink-0">
                    {currentQty === 0 ? (
                      <button
                        type="button"
                        onClick={() => handleIncrement(prod)}
                        className="px-3 py-1.5 rounded-lg bg-[#E4171E] hover:bg-[#B80F16] active:bg-[#B80F16] active:scale-95 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </button>
                    ) : (
                      <div className="flex items-center bg-white border border-[#E8E0D5] rounded-lg p-0.5 shadow-xs">
                        <button
                          type="button"
                          onClick={() => handleDecrement(prod.id)}
                          className="p-1 text-[#6B6B6B] hover:text-[#1C1C1C] transition-colors cursor-pointer"
                          aria-label="Diminuir"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-[#1C1C1C] tabular-nums">
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncrement(prod)}
                          className="p-1 text-[#6B6B6B] hover:text-[#1C1C1C] transition-colors cursor-pointer"
                          aria-label="Aumentar"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-5 bg-white border-t border-[#E8E0D5] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-lg">
          <button
            type="button"
            onClick={handleSkipClick}
            className="w-full sm:w-auto min-h-[48px] px-4 py-3 rounded-xl border border-[#E8E0D5] hover:bg-[#F5EFE6] text-xs font-semibold text-[#6B6B6B] hover:text-[#1C1C1C] transition-colors cursor-pointer text-center flex items-center justify-center"
          >
            Continuar sem adicionar nada
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="w-full sm:w-auto min-h-[48px] flex-1 sm:max-w-xs py-3 px-5 rounded-xl bg-[#E4171E] hover:bg-[#B80F16] active:bg-[#B80F16] active:scale-98 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>Avançar para o Carrinho</span>
              {totalExtraItemsCount > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] font-bold rounded bg-white text-[#E4171E]">
                  +{totalExtraItemsCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 font-mono text-xs sm:text-sm">
              {totalExtraPrice > 0 && (
                <span>+{formatBRL(totalExtraPrice)}</span>
              )}
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
