import React, { useMemo, useState } from 'react';
import { X, Trash2, Plus, Minus, Edit3, ShoppingBag, ArrowRight, Sparkles, Check } from 'lucide-react';
import { CartItem, Product } from '../types';
import { formatBRL } from '../data/menuData';
import { safeImageUrl } from '../utils/imageUrl';
import { ProductImage } from './ProductImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  deliveryType: 'entrega' | 'retirada';
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onEditItem: (item: CartItem) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  allProducts?: Product[];
  onAddComplement?: (product: Product) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  deliveryFee,
  deliveryType,
  onUpdateQuantity,
  onRemoveItem,
  onEditItem,
  onClearCart,
  onProceedToCheckout,
  allProducts = [],
  onAddComplement,
}) => {
  const grandTotal = subtotal;

  const [addedProductIds, setAddedProductIds] = useState<string[]>([]);

  // Upsell Exclusivo: Somente Esfihas Doces cadastradas, sem repetições
  const upsellRecommendations = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];

    const sweets = allProducts.filter(
      (p) =>
        p.category === 'esfihas-doces' &&
        (!items.some((it) => it.product.id === p.id) || addedProductIds.includes(p.id))
    );
    return sweets.slice(0, 4);
  }, [allProducts, items, addedProductIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-[100vw] sm:max-w-md max-h-[100dvh] h-full bg-[#FBF9F6] border-l border-[#E8E0D5] text-[#1C1C1C] flex flex-col shadow-2xl">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-[#E8E0D5] flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#FBE4E1] text-[#E4171E]">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-bold text-[#1C1C1C]">
                  Seu Pedido
                </h2>
                <span className="text-xs text-[#6B6B6B]">
                  {items.length} {items.length === 1 ? 'item selecionado' : 'itens selecionados'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#6B6B6B] hover:text-[#1C1C1C] hover:bg-[#F5EFE6] transition-colors cursor-pointer"
              aria-label="Fechar carrinho"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#6B6B6B]">
                <div className="w-16 h-16 rounded-full bg-[#F5EFE6] flex items-center justify-center text-[#6B6B6B] mb-4">
                  <ShoppingBag className="w-8 h-8 opacity-60 text-[#E4171E]" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-[#1C1C1C] mb-2">
                  Seu carrinho está vazio
                </h3>
                <p className="text-xs sm:text-sm text-[#6B6B6B] max-w-xs mb-6">
                  Explore nosso cardápio de pizzas artesanais no forno a lenha e monte seu pedido.
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[#E4171E] hover:bg-[#B80F16] active:bg-[#B80F16] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Ver Cardápio
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="bg-white border border-[#E8E0D5] rounded-xl p-3.5 flex flex-col justify-between gap-3 shadow-xs hover:border-[#D8CEBF] transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Item Thumbnail */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-[#E8E0D5] bg-[#F0EAE1] shrink-0">
                      <ProductImage
                        product={item.product}
                        className="w-full h-full object-cover object-center"
                        loading="lazy"
                        width={56}
                        height={56}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Product Header / Title */}
                      {(() => {
                        const flavors = item.flavors && item.flavors.length > 0
                          ? item.flavors
                          : (item.isHalfHalf && item.secondFlavor ? [item.product, item.secondFlavor] : [item.product]);
                        const isMultiFlavor = flavors.length > 1;

                        if (isMultiFlavor) {
                          const sizeTitle = item.size === 'broto' ? 'Broto' : '8 Fatias';
                          return (
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-mono font-bold text-[#E4171E] bg-[#FBE4E1] px-1.5 py-0.5 rounded">
                                  {flavors.length} SABORES
                                </span>
                                <h4 className="font-bold text-sm text-[#1C1C1C]">
                                  Pizza {sizeTitle} — {flavors.length} sabores
                                </h4>
                              </div>

                              {/* Box listing all selected flavors */}
                              <div className="mt-2 p-2.5 rounded-lg bg-[#FBE4E1]/50 border border-[#E8E0D5] space-y-1">
                                <span className="text-[10px] uppercase font-bold text-[#E4171E] block">
                                  Sabores selecionados:
                                </span>
                                <ul className="text-xs text-[#1C1C1C] space-y-1">
                                  {flavors.map((f, idx) => (
                                    <li key={idx} className="flex items-center gap-1.5">
                                      <span className="text-[#E4171E] font-bold">•</span>
                                      <span className="font-medium">{f.name}</span>
                                    </li>
                                  ))}
                                </ul>
                                <span className="text-[10px] text-[#6B6B6B] block pt-1 border-t border-[#E8E0D5]/50 italic">
                                  Valor da pizza calculado pelo sabor mais caro
                                </span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.product.code && (
                              <span className="text-[10px] font-mono font-bold text-[#E4171E] bg-[#FBE4E1] px-1.5 py-0.5 rounded">
                                #{item.product.code}
                              </span>
                            )}
                            <h4 className="font-semibold text-sm text-[#1C1C1C]">
                              {item.product.name}
                            </h4>
                          </div>
                        );
                      })()}

                      {/* Size details (if single flavor pizza) */}
                      {item.size && !(item.flavors && item.flavors.length > 1) && !(item.isHalfHalf && item.secondFlavor) && (
                        <div className="text-[11px] text-[#6B6B6B] mt-0.5">
                          Tamanho: <strong className="text-[#1C1C1C]">{item.size === 'broto' ? 'Broto (4 fatias)' : 'Pizza Grande (8 fatias)'}</strong>
                        </div>
                      )}

                      {/* Crust */}
                      {item.crust && item.crust.price > 0 && (
                        <div className="text-[11px] text-[#6B6B6B]">
                          Borda: <span className="text-[#1C1C1C]">{item.crust.name} (+{formatBRL(item.crust.price)})</span>
                        </div>
                      )}

                      {/* Extra toppings */}
                      {item.extraToppings && item.extraToppings.length > 0 ? (
                        item.extraToppings.map((extra) => (
                          <div key={extra.id} className="text-[11px] text-[#6B6B6B]">
                            Adicional: <span className="text-[#1C1C1C]">{extra.name} (+{formatBRL(extra.price)})</span>
                          </div>
                        ))
                      ) : item.extraTopping ? (
                        <div className="text-[11px] text-[#6B6B6B]">
                          Adicional: <span className="text-[#1C1C1C]">{item.extraTopping.name} (+{formatBRL(item.extraTopping.price)})</span>
                        </div>
                      ) : null}

                      {/* Notes */}
                      {item.notes && (
                        <div className="text-[11px] text-[#6B6B6B] italic mt-1 bg-[#F5EFE6] p-1.5 rounded">
                          Obs: {item.notes}
                        </div>
                      )}
                    </div>

                    {/* Preço em destaque: bold #E4171E */}
                    <div className="text-right shrink-0">
                      <div className="font-bold text-sm text-[#E4171E] tabular-nums">
                        {formatBRL(item.unitPrice * item.quantity)}
                      </div>
                      <div className="text-[10px] text-[#6B6B6B]">
                        {formatBRL(item.unitPrice)} un
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#E8E0D5]/70">
                    <div className="flex items-center gap-1">
                      {item.product.isPizza && (
                        <button
                          onClick={() => onEditItem(item)}
                          className="p-1.5 text-[#6B6B6B] hover:text-[#1C1C1C] hover:bg-[#F5EFE6] rounded-md transition-colors cursor-pointer"
                          title="Editar opções da pizza"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveItem(item.cartItemId)}
                        className="p-1.5 text-[#6B6B6B] hover:text-[#E4171E] hover:bg-[#FBE4E1] rounded-md transition-colors cursor-pointer"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center bg-[#F5EFE6] border border-[#E8E0D5] rounded-lg p-0.5">
                      <button
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                        className="p-1 text-[#6B6B6B] hover:text-[#1C1C1C] transition-colors cursor-pointer"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-[#1C1C1C] tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                        className="p-1 text-[#6B6B6B] hover:text-[#1C1C1C] transition-colors cursor-pointer"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* UPSELL: QUE TAL UMA SOBREMESA? (ESFIHAS DOCES) */}
            {items.length > 0 && upsellRecommendations.length > 0 && onAddComplement && (
              <div className="mt-4 pt-3 border-t border-[#E8E0D5] bg-[#F5EFE6]/50 p-3 rounded-xl border">
                <div className="mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#E4171E]" />
                    <h4 className="text-xs font-bold text-[#1C1C1C] uppercase tracking-wide">
                      Que tal uma sobremesa?
                    </h4>
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                    Finalize seu pedido com uma de nossas esfihas doces.
                  </p>
                </div>
                <div className="space-y-2">
                  {upsellRecommendations.map((prod) => {
                    const isAdded = addedProductIds.includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        className="bg-white p-2 sm:p-2.5 rounded-lg border border-[#E8E0D5] flex items-center justify-between gap-2.5 shadow-2xs hover:border-[#D8CEBF] transition-all"
                      >
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-[#F0EAE1] shrink-0 border border-[#E8E0D5]">
                          <ProductImage
                            product={prod}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            width={40}
                            height={40}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-xs text-[#1C1C1C] truncate block">
                            {prod.name}
                          </span>
                          <span className="font-bold text-xs text-[#E4171E] font-mono">
                            {formatBRL(prod.price)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!isAdded) {
                              onAddComplement(prod);
                              setAddedProductIds((prev) => [...prev, prod.id]);
                            }
                          }}
                          disabled={isAdded}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 ${
                            isAdded
                              ? 'bg-emerald-600 text-white cursor-default'
                              : 'bg-[#E4171E] hover:bg-[#B80F16] active:scale-95 text-white cursor-pointer'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Adicionado ✓</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Adicionar</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer with Totals and Checkout CTA */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#E8E0D5] bg-white space-y-3 shrink-0 shadow-xl pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Subtotal</span>
                  <span className="font-mono text-[#1C1C1C] font-semibold">{formatBRL(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-[#6B6B6B]">
                  <span>Tipo de Pedido</span>
                  <span className="text-[11px] font-semibold text-[#1C1C1C]">
                    {deliveryType === 'entrega' ? 'Entrega em Domicílio' : 'Retirada no Balcão'}
                  </span>
                </div>
                {deliveryType === 'entrega' && (
                  <p className="text-[10px] text-[#888888] italic">
                    A taxa de entrega oficial é calculada automaticamente no checkout com base na distância do Google Maps.
                  </p>
                )}
                <div className="flex justify-between text-base font-bold text-[#1C1C1C] pt-2 border-t border-[#E8E0D5]">
                  <span>Total do Pedido</span>
                  <span className="text-[#E4171E] font-bold tabular-nums">
                    {formatBRL(grandTotal)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={onClearCart}
                  className="px-3 py-3 rounded-xl border border-[#E8E0D5] hover:bg-[#F5EFE6] text-xs font-semibold text-[#6B6B6B] hover:text-[#1C1C1C] transition-colors cursor-pointer"
                  title="Esvaziar carrinho"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Finalize order button (#E4171E with hover #B80F16) */}
                <button
                  onClick={onProceedToCheckout}
                  className="flex-1 min-h-[48px] py-3 px-4 rounded-xl bg-[#E4171E] hover:bg-[#B80F16] active:bg-[#B80F16] text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>FINALIZAR PEDIDO</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
