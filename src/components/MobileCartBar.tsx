import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatBRL } from '../data/menuData';

interface MobileCartBarProps {
  itemCount: number;
  total: number;
  onOpenCart: () => void;
}

export const MobileCartBar: React.FC<MobileCartBarProps> = ({
  itemCount,
  total,
  onOpenCart,
}) => {
  const [isBumping, setIsBumping] = React.useState(false);

  React.useEffect(() => {
    if (itemCount > 0) {
      setIsBumping(true);
      const timer = window.setTimeout(() => setIsBumping(false), 300);
      return () => window.clearTimeout(timer);
    }
  }, [itemCount]);

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 bg-[#FBF9F6]/95 backdrop-blur-md border-t border-[#E8E0D5] lg:hidden shadow-2xl pb-[max(0.85rem,env(safe-area-inset-bottom))] animate-fade-in-up">
      <div className="w-full max-w-[420px] mx-auto flex items-center justify-between gap-3">
        <div
          onClick={onOpenCart}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer select-none py-1 flex-1"
        >
          <div
            className={`relative p-2.5 rounded-xl bg-[#E4171E] text-white flex items-center justify-center shadow-xs shrink-0 transition-transform duration-200 ${
              isBumping ? 'scale-110 shadow-red-900/30' : 'scale-100'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span
              className={`absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-white text-[#E4171E] text-[10px] font-bold rounded-full flex items-center justify-center shadow transition-transform duration-200 ${
                isBumping ? 'scale-125' : 'scale-100'
              }`}
            >
              {itemCount}
            </span>
          </div>

          <div className="min-w-0 text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B6B6B] block">
              Total do Pedido
            </span>
            <span className="text-base font-bold text-[#E4171E] tabular-nums block">
              {formatBRL(total)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCart}
          className="min-h-[48px] px-4 sm:px-5 py-3 rounded-xl bg-[#E4171E] hover:bg-[#B80F16] active:bg-[#B80F16] active:scale-95 text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
        >
          <span>VER CARRINHO</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
