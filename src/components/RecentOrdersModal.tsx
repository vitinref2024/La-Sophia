import React from 'react';
import { X, Clock, Repeat, ShoppingBag, Truck, Store, Calendar, ArrowRight, Trash2 } from 'lucide-react';
import { RecentOrder } from '../types';
import { formatBRL } from '../data/menuData';

interface RecentOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: RecentOrder[];
  onReorder: (order: RecentOrder) => void;
  onClearHistory: () => void;
}

export const RecentOrdersModal: React.FC<RecentOrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  onReorder,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl max-w-[100vw] max-h-[96dvh] bg-[#FBF9F6] border border-[#E8E0D5] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#1C1C1C] my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 pr-10 sm:pr-12 bg-white border-b border-[#E8E0D5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#FBE4E1] text-[#E4171E] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg sm:text-xl font-bold text-[#1C1C1C]">
                  Últimos Pedidos
                </h2>
                {orders.length > 0 && (
                  <span className="text-[11px] font-semibold bg-[#F5EFE6] text-[#6B6B6B] px-2 py-0.5 rounded-full border border-[#E8E0D5]">
                    {orders.length}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-[#6B6B6B] mt-0.5">
                Histórico salvo neste aparelho. Peça novamente com um clique e revise antes de enviar.
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {orders.length === 0 ? (
            <div className="py-12 px-4 text-center max-w-md mx-auto">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F5EFE6] border border-[#E8E0D5] text-[#6B6B6B] flex items-center justify-center mb-3">
                <ShoppingBag className="w-7 h-7 text-[#6B6B6B]" />
              </div>
              <h3 className="text-base font-bold text-[#1C1C1C] mb-1">
                Nenhum pedido anterior encontrado
              </h3>
              <p className="text-xs text-[#6B6B6B] leading-relaxed">
                Os pedidos que você finalizar pelo WhatsApp ficarão salvos automaticamente neste dispositivo para você repetir com facilidade.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const isDelivery = order.deliveryType === 'entrega';
              const totalItemsCount = order.items.reduce((acc, it) => acc + it.quantity, 0);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-[#E8E0D5] p-4 sm:p-5 shadow-xs hover:border-[#D8CEBF] transition-colors flex flex-col gap-3.5"
                >
                  {/* Order Top Bar: Date & Delivery Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E0D5] pb-3">
                    <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                      <Calendar className="w-3.5 h-3.5 text-[#E4171E]" />
                      <span className="font-semibold text-[#1C1C1C]">{order.formattedDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                          isDelivery
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {isDelivery ? (
                          <>
                            <Truck className="w-3 h-3" />
                            <span>Entrega</span>
                          </>
                        ) : (
                          <>
                            <Store className="w-3 h-3" />
                            <span>Retirada</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2 py-1">
                    {order.items.map((item, idx) => {
                      const flavors = item.flavors && item.flavors.length > 0
                        ? item.flavors
                        : (item.isHalfHalf && item.secondFlavor ? [item.product, item.secondFlavor] : [item.product]);
                      const isMulti = flavors.length > 1;

                      let title = item.product.name;
                      if (isMulti) {
                        title = `Pizza ${item.size === 'broto' ? 'Broto' : '8 Fatias'} (${flavors.length} sabores)`;
                      }
                      const sizeName = item.size === 'broto' ? 'Broto (4 fatias)' : item.size === 'pizza' ? 'Pizza (8 fatias)' : null;

                      return (
                        <div key={idx} className="text-xs flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[#E4171E] tabular-nums">
                                {item.quantity}x
                              </span>
                              <span className="font-semibold text-[#1C1C1C]">{title}</span>
                              {sizeName && !isMulti && (
                                <span className="text-[10px] text-[#6B6B6B] bg-[#F5EFE6] px-1.5 py-0.2 rounded border border-[#E8E0D5]">
                                  {sizeName}
                                </span>
                              )}
                            </div>

                            {/* Multi-flavor list */}
                            {isMulti && (
                              <div className="text-[11px] text-[#6B6B6B] pl-4 mt-0.5 space-y-0.5">
                                <span className="font-medium text-[#1C1C1C]">Sabores:</span>{' '}
                                {flavors.map((f) => f.name).join(' + ')}
                              </div>
                            )}

                            {/* Additional info */}
                            <div className="text-[11px] text-[#6B6B6B] pl-4 mt-0.5 space-y-0.5">
                              {item.crust && item.crust.id !== 'tradicional' && (
                                <div>Borda: {item.crust.name}</div>
                              )}
                              {item.extraTopping && <div>Adicional: {item.extraTopping.name}</div>}
                              {item.notes && <div className="italic">Obs: "{item.notes}"</div>}
                            </div>
                          </div>

                          <span className="text-xs font-semibold text-[#1C1C1C] tabular-nums shrink-0">
                            {formatBRL(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Footer: Total and Reorder Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E8E0D5] bg-[#FBF9F6] -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3 sm:p-4 rounded-b-xl">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-[#6B6B6B]">
                        Total ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'}):
                      </span>
                      <span className="text-base font-bold text-[#E4171E] tabular-nums">
                        {formatBRL(order.total)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onReorder(order)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#E4171E] hover:bg-[#B80F16] active:bg-[#B80F16] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Repeat className="w-3.5 h-3.5" />
                      <span>Pedir Novamente</span>
                      <ArrowRight className="w-3 h-3 opacity-70" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {orders.length > 0 && (
          <div className="p-3 sm:p-4 bg-white border-t border-[#E8E0D5] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClearHistory}
              className="text-[11px] text-[#6B6B6B] hover:text-red-600 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar histórico</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#F5EFE6] hover:bg-[#E8E0D5] text-[#1C1C1C] text-xs font-semibold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
